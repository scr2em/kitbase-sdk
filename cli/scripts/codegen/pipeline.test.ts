import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { buildEmittableOperations, generateCommands } from "./pipeline.js";
import { DENYLIST_TAGS, DENYLIST_OPERATION_IDS, ID_OVERRIDES } from "./overrides.js";
import type { SpecOperation } from "./spec.js";

// End-to-end coverage of the actual generation pipeline (denylist -> naming -> overrides ->
// collision detection -> emit), verifying business rules — "every operation gets a unique,
// resolvable command", "excluded operations never leak into the tree", "known collisions are
// actually fixed by the shipped overrides.ts" — rather than freezing today's output.

function op(overrides: Partial<SpecOperation>): SpecOperation {
	return {
		path: "/widgets",
		method: "get",
		operationId: "op",
		tags: [],
		parameters: [],
		bodyFields: [],
		...overrides,
	};
}

describe("buildEmittableOperations", () => {
	it("excludes every operation whose tag is denylisted", () => {
		const tag = [...DENYLIST_TAGS][0]!;
		const { items, excludedCount } = buildEmittableOperations([op({ operationId: "a", tags: [tag] })]);
		expect(items).toHaveLength(0);
		expect(excludedCount).toBe(1);
	});

	it("excludes an operation by id even when its tag would otherwise be included", () => {
		const operationId = [...DENYLIST_OPERATION_IDS][0]!;
		const { items } = buildEmittableOperations([op({ operationId, tags: ["Users"] })]);
		expect(items).toHaveLength(0);
	});

	it("never generates change-password or cancel-subscription — deliberately excluded as too sensitive/destructive for a bare CLI flag", () => {
		const { items } = buildEmittableOperations([
			op({ operationId: "changePassword", tags: ["Users"], path: "/users/me/password", method: "put" }),
			op({ operationId: "cancelSubscription", tags: ["Billing"], path: "/{orgSlug}/billing/cancel-subscription", method: "post" }),
		]);
		expect(items).toHaveLength(0);
	});

	it("includes an operation whose tag and id are both clean", () => {
		const { items, includedCount } = buildEmittableOperations([
			op({ operationId: "listWidgets", tags: ["Widgets"] }),
		]);
		expect(items).toHaveLength(1);
		expect(includedCount).toBe(1);
	});

	it("applies an ID_OVERRIDES entry instead of the mechanically-derived id", () => {
		const { items } = buildEmittableOperations([
			op({ path: "/users/me", method: "patch", operationId: "updateCurrentUser", tags: ["Users"] }),
		]);
		// naming.ts alone would derive something else for a bare /users/me PATCH; the shipped
		// override folds it under the "account" topic instead.
		expect(items[0]!.named.idSegments).toEqual(ID_OVERRIDES.updateCurrentUser);
	});

	it("detects a real collision: two operations under the same topic that both resolve to 'get'", () => {
		const shared = { tags: ["Widgets"] };
		const { collisions } = buildEmittableOperations([
			op({ ...shared, path: "/{orgSlug}/widgets/{widgetId}", method: "get", operationId: "getWidgetById" }),
			op({ ...shared, path: "/{orgSlug}/widgets/{otherId}", method: "get", operationId: "getWidgetByOtherId" }),
		]);
		expect(collisions).toHaveLength(1);
		expect(collisions[0]).toContain("getWidgetById");
		expect(collisions[0]).toContain("getWidgetByOtherId");
	});

	it("resolves the real 'clear all views' vs 'delete one view' collision via the shipped overrides.ts", () => {
		// This reproduces the exact operations that collide under naming.ts alone (see
		// naming.test.ts's "known limitation" case) and proves the actual override entry fixes it
		// when run through the full pipeline, not just in isolation.
		const shared = { tags: ["In-App Messages"] };
		const { collisions, items } = buildEmittableOperations([
			op({
				...shared,
				path: "/{orgSlug}/projects/{projectId}/in-app-messages/{messageId}/views",
				method: "get",
				operationId: "listInAppMessageViews",
			}),
			op({
				...shared,
				path: "/{orgSlug}/projects/{projectId}/in-app-messages/{messageId}/views",
				method: "delete",
				operationId: "clearInAppMessageViews",
			}),
			op({
				...shared,
				path: "/{orgSlug}/projects/{projectId}/in-app-messages/{messageId}/views/{viewId}",
				method: "delete",
				operationId: "deleteInAppMessageView",
			}),
		]);

		expect(collisions).toEqual([]);
		const ids = items.map((i) => i.named.idSegments.join(" "));
		expect(new Set(ids).size).toBe(3);
	});
});

describe("generateCommands (full pipeline, real filesystem)", () => {
	const tmpDirs: string[] = [];
	const tmpFiles: string[] = [];

	function writeFixtureSpec(): string {
		const file = path.join(os.tmpdir(), `kitbase-cli-pipeline-test-${Date.now()}-${Math.random().toString(36).slice(2)}.yaml`);
		fs.writeFileSync(
			file,
			`
paths:
  /{orgSlug}/projects/{projectId}/widgets:
    get:
      operationId: listWidgets
      tags: [Widgets]
      summary: List widgets
      parameters:
        - name: page
          in: query
          required: false
          schema: { type: integer }
    post:
      operationId: createWidget
      tags: [Widgets]
      summary: Create widget
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [name]
              properties:
                name: { type: string }
  /{orgSlug}/projects/{projectId}/widgets/{widgetId}:
    get:
      operationId: getWidget
      tags: [Widgets]
      summary: Get widget
    delete:
      operationId: deleteWidget
      tags: [Widgets]
      summary: Delete widget
  /auth/login:
    post:
      operationId: login
      tags: [Authentication]
      summary: Log in
`,
		);
		tmpFiles.push(file);
		return file;
	}

	function makeSrcDir(): string {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kitbase-cli-pipeline-src-"));
		tmpDirs.push(dir);
		return dir;
	}

	afterEach(() => {
		for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
		for (const file of tmpFiles.splice(0)) fs.rmSync(file, { force: true });
	});

	it("generates exactly the non-denylisted operations as command files", () => {
		const specPath = writeFixtureSpec();
		const srcDir = makeSrcDir();

		const result = generateCommands(specPath, srcDir);

		expect(result.includedOperations).toBe(4); // listWidgets, createWidget, getWidget, deleteWidget
		expect(result.excludedOperations).toBe(1); // login (Authentication tag)
		expect(result.commandFiles).toBe(4);

		expect(fs.existsSync(path.join(srcDir, "commands", "widgets", "list.ts"))).toBe(true);
		expect(fs.existsSync(path.join(srcDir, "commands", "widgets", "create.ts"))).toBe(true);
		expect(fs.existsSync(path.join(srcDir, "commands", "widgets", "get.ts"))).toBe(true);
		expect(fs.existsSync(path.join(srcDir, "commands", "widgets", "delete.ts"))).toBe(true);
	});

	it("never generates a command for a denylisted-tag operation", () => {
		const specPath = writeFixtureSpec();
		const srcDir = makeSrcDir();
		generateCommands(specPath, srcDir);

		// No "login" command anywhere in the generated tree — Authentication is hand-written only.
		const walk = (dir: string): string[] =>
			fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
				e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
			);
		const allFiles = walk(path.join(srcDir, "commands"));
		expect(allFiles.some((f) => f.endsWith("login.ts"))).toBe(false);
	});

	it("a required body field is exposed as a flag but is not oclif-required (so --data alone still works)", () => {
		const specPath = writeFixtureSpec();
		const srcDir = makeSrcDir();
		generateCommands(specPath, srcDir);

		const content = fs.readFileSync(path.join(srcDir, "commands", "widgets", "create.ts"), "utf-8");
		expect(content).toContain('"name": Flags.string(');
		expect(content).not.toMatch(/"name":\s*Flags\.string\(\{[^}]*required: true/);
	});

	it("throws a descriptive error and writes nothing when operations collide", () => {
		const specPath = path.join(os.tmpdir(), `kitbase-cli-pipeline-collision-${Date.now()}.yaml`);
		tmpFiles.push(specPath);
		fs.writeFileSync(
			specPath,
			`
paths:
  /{orgSlug}/widgets/{widgetId}:
    get:
      operationId: getWidgetById
      tags: [Widgets]
  /{orgSlug}/widgets/{otherId}:
    get:
      operationId: getWidgetByOtherId
      tags: [Widgets]
`,
		);
		const srcDir = makeSrcDir();

		expect(() => generateCommands(specPath, srcDir)).toThrow(/collisions/i);
		expect(fs.existsSync(path.join(srcDir, "commands"))).toBe(false);
	});

	it("is idempotent: running twice against the same spec produces the same file count", () => {
		const specPath = writeFixtureSpec();
		const srcDir = makeSrcDir();
		const first = generateCommands(specPath, srcDir);
		const second = generateCommands(specPath, srcDir);
		expect(second.commandFiles).toBe(first.commandFiles);
	});
});
