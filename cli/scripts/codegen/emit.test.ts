import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
	emit,
	flagLiteral,
	argLiteral,
	relativeImportFromCommand,
	toClassName,
	renderCommandFile,
	renderDescriptorsFile,
	GENERATED_BANNER,
	type EmittableOperation,
} from "./emit.js";
import type { FlagSpec } from "./flags.js";
import type { SpecOperation } from "./spec.js";
import type { NamedOperation } from "./naming.js";

function flag(overrides: Partial<FlagSpec>): FlagSpec {
	return { name: "x", kind: "string", required: false, ...overrides };
}

function makeItem(overrides: Partial<EmittableOperation> = {}): EmittableOperation {
	const operation: SpecOperation = {
		path: "/{orgSlug}/projects/{projectId}/feature-flags/{flagKey}",
		method: "get",
		operationId: "getFeatureFlag",
		tags: ["Feature Flags"],
		summary: "Get feature flag details",
		parameters: [{ name: "flagKey", in: "path", required: true, description: "Feature flag key" }],
		bodyFields: [],
	};
	const named: NamedOperation = {
		operation,
		idSegments: ["feature-flags", "get"],
		needsOrg: true,
		needsProject: true,
		pathParams: ["flagKey"],
	};
	return {
		named,
		operation,
		descriptorKey: "getFeatureFlag",
		queryFlags: [],
		bodyFlags: [],
		...overrides,
	};
}

describe("flagLiteral", () => {
	it("marks a required query flag as oclif-required", () => {
		const literal = flagLiteral(flag({ required: true }), true);
		expect(literal).toContain("required: true");
	});

	it("never marks a required body flag as oclif-required — --data is a valid alternative input", () => {
		// Regression test: this exact bug shipped once — a required body field (e.g. flagKey on
		// `feature-flags create`) blocked `--data '{"flagKey": ...}'` entirely because oclif itself
		// rejected the command before operation-command.ts's own --data merging ever ran.
		const literal = flagLiteral(flag({ required: true }), false);
		expect(literal).not.toContain("required: true");
	});

	it("uses Flags.integer for kind integer", () => {
		expect(flagLiteral(flag({ kind: "integer" }), true)).toMatch(/^Flags\.integer\(/);
	});

	it("uses Flags.boolean for kind boolean", () => {
		expect(flagLiteral(flag({ kind: "boolean" }), true)).toMatch(/^Flags\.boolean\(/);
	});

	it("uses Flags.string for kind string", () => {
		expect(flagLiteral(flag({ kind: "string" }), true)).toMatch(/^Flags\.string\(/);
	});

	it("includes the description when present", () => {
		expect(flagLiteral(flag({ description: "Page number" }), true)).toContain('"Page number"');
	});

	it("emits multiple: true for a repeatable flag, and omits it otherwise", () => {
		expect(flagLiteral(flag({ multiple: true }), true)).toContain("multiple: true");
		expect(flagLiteral(flag({}), true)).not.toContain("multiple");
	});

	it("includes options when the flag has a non-empty enum", () => {
		expect(flagLiteral(flag({ options: ["asc", "desc"] }), true)).toContain('["asc","desc"]');
	});

	it("omits options when there are none", () => {
		expect(flagLiteral(flag({ options: undefined }), true)).not.toContain("options:");
	});
});

describe("argLiteral", () => {
	it("uses the provided description when present", () => {
		expect(argLiteral("flagKey", "Feature flag key")).toContain('"Feature flag key"');
	});

	it("falls back to the arg name itself when there's no description", () => {
		// Regression test: oclif only renders the ARGUMENTS help section when at least one arg has
		// a description — an arg with no description silently disappeared from --help entirely.
		expect(argLiteral("viewId", undefined)).toContain('"viewId"');
	});

	it("always marks the arg as required — every positional path param is mandatory", () => {
		expect(argLiteral("flagKey", "Feature flag key")).toContain("required: true");
	});
});

describe("relativeImportFromCommand", () => {
	it("climbs one level out of commands/ for a top-level command (commandDir '.')", () => {
		expect(relativeImportFromCommand(".", "runtime/operation-command.js")).toBe("../runtime/operation-command.js");
	});

	it("climbs two levels for a single-segment topic", () => {
		expect(relativeImportFromCommand("feature-flags", "runtime/operation-command.js")).toBe(
			"../../runtime/operation-command.js",
		);
	});

	it("climbs three levels for a two-segment nested topic", () => {
		// Regression test: an earlier version of this function only accounted for climbing out of
		// the topic segments and forgot the extra level needed to escape commands/ itself, which
		// silently broke every command nested more than one level deep (e.g. ai-visibility/brands/*).
		expect(relativeImportFromCommand("ai-visibility/brands", "runtime/operation-command.js")).toBe(
			"../../../runtime/operation-command.js",
		);
	});
});

describe("toClassName", () => {
	it("PascalCases and joins topic+verb segments", () => {
		expect(toClassName(["feature-flags", "get"])).toBe("FeatureFlagsGet");
	});

	it("PascalCases each kebab-case word within a segment", () => {
		expect(toClassName(["ai-visibility", "jobs", "pause"])).toBe("AiVisibilityJobsPause");
	});

	it("PascalCases a segment that is itself multi-word kebab-case", () => {
		expect(toClassName(["in-app-messages", "list-with-permissions"])).toBe("InAppMessagesListWithPermissions");
	});
});

describe("renderCommandFile", () => {
	it("starts with the generated banner", () => {
		const content = renderCommandFile(makeItem(), "feature-flags", "FeatureFlagsGet");
		expect(content.startsWith(GENERATED_BANNER)).toBe(true);
	});

	it("imports the runtime and descriptors using the correct relative depth", () => {
		const content = renderCommandFile(makeItem(), "feature-flags", "FeatureFlagsGet");
		expect(content).toContain('from "../../runtime/operation-command.js"');
		expect(content).toContain('from "../../generated/descriptors.js"');
	});

	it("looks up its descriptor by the operation's descriptorKey", () => {
		const content = renderCommandFile(makeItem({ descriptorKey: "getFeatureFlag" }), "feature-flags", "X");
		expect(content).toContain('descriptors["getFeatureFlag"]');
	});

	it("includes a static args block for each path param, in order", () => {
		const content = renderCommandFile(makeItem(), "feature-flags", "FeatureFlagsGet");
		expect(content).toContain("static args = {");
		expect(content).toContain('"flagKey": Args.string(');
	});

	it("omits the static args block entirely when there are no path params", () => {
		const item = makeItem({ named: { ...makeItem().named, pathParams: [] } });
		const content = renderCommandFile(item, "feature-flags", "X");
		expect(content).not.toContain("static args");
	});

	it("includes a static flags block combining query and body flags", () => {
		const item = makeItem({
			queryFlags: [flag({ name: "page", kind: "integer" })],
			bodyFlags: [flag({ name: "name", required: true })],
		});
		const content = renderCommandFile(item, "feature-flags", "X");
		expect(content).toContain('"page": Flags.integer(');
		expect(content).toContain('"name": Flags.string(');
	});

	it("omits the static flags block entirely when there are no flags", () => {
		const content = renderCommandFile(makeItem(), "feature-flags", "X");
		expect(content).not.toContain("static flags");
	});

	it("uses the operation summary as the description, falling back to operationId when absent", () => {
		const withSummary = renderCommandFile(makeItem(), "feature-flags", "X");
		expect(withSummary).toContain('"Get feature flag details"');

		const noSummaryItem = makeItem();
		noSummaryItem.operation = { ...noSummaryItem.operation, summary: undefined };
		const withoutSummary = renderCommandFile(noSummaryItem, "feature-flags", "X");
		expect(withoutSummary).toContain('"getFeatureFlag"');
	});
});

describe("renderDescriptorsFile", () => {
	it("starts with the generated banner", () => {
		expect(renderDescriptorsFile([makeItem()]).startsWith(GENERATED_BANNER)).toBe(true);
	});

	it("emits method/path/needsOrg/needsProject/pathParams for each operation", () => {
		const content = renderDescriptorsFile([makeItem()]);
		expect(content).toContain('method: "get"');
		expect(content).toContain('path: "/{orgSlug}/projects/{projectId}/feature-flags/{flagKey}"');
		expect(content).toContain("needsOrg: true");
		expect(content).toContain("needsProject: true");
		expect(content).toContain('pathParams: ["flagKey"]');
	});

	it("lists only the names of query/body flags, and only required body fields under requiredBodyFields", () => {
		const item = makeItem({
			queryFlags: [flag({ name: "page" })],
			bodyFlags: [flag({ name: "name", required: true }), flag({ name: "description", required: false })],
		});
		const content = renderDescriptorsFile([item]);
		expect(content).toContain('queryParams: ["page"]');
		expect(content).toContain('bodyFields: ["name","description"]');
		expect(content).toContain('requiredBodyFields: ["name"]');
	});
});

describe("emit (filesystem behavior)", () => {
	const tmpDirs: string[] = [];

	function makeSrcDir(): string {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kitbase-cli-emit-test-"));
		tmpDirs.push(dir);
		return dir;
	}

	afterEach(() => {
		for (const dir of tmpDirs.splice(0)) {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});

	it("writes each command to a path derived from its idSegments", () => {
		const srcDir = makeSrcDir();
		emit([makeItem()], srcDir);
		expect(fs.existsSync(path.join(srcDir, "commands", "feature-flags", "get.ts"))).toBe(true);
	});

	it("writes generated/descriptors.ts alongside the commands", () => {
		const srcDir = makeSrcDir();
		emit([makeItem()], srcDir);
		expect(fs.existsSync(path.join(srcDir, "generated", "descriptors.ts"))).toBe(true);
	});

	it("nests multi-segment topics into matching subdirectories", () => {
		const srcDir = makeSrcDir();
		const item = makeItem({
			named: { ...makeItem().named, idSegments: ["ai-visibility", "jobs", "pause"] },
		});
		emit([item], srcDir);
		expect(fs.existsSync(path.join(srcDir, "commands", "ai-visibility", "jobs", "pause.ts"))).toBe(true);
	});

	it("refuses to overwrite a hand-written file that lacks the generated banner", () => {
		const srcDir = makeSrcDir();
		const handWrittenDir = path.join(srcDir, "commands", "feature-flags");
		fs.mkdirSync(handWrittenDir, { recursive: true });
		fs.writeFileSync(path.join(handWrittenDir, "get.ts"), "// hand-written, do not touch\nexport default class {}\n");

		expect(() => emit([makeItem()], srcDir)).toThrow(/collides with a hand-written file/);
		// And the hand-written file must survive the attempt untouched.
		expect(fs.readFileSync(path.join(handWrittenDir, "get.ts"), "utf-8")).toContain("hand-written, do not touch");
	});

	it("freely overwrites a file that already has the generated banner (re-running codegen is idempotent)", () => {
		const srcDir = makeSrcDir();
		emit([makeItem()], srcDir);
		// Second run with a changed summary must fully replace the old generated file, not error.
		const changed = makeItem();
		changed.operation = { ...changed.operation, summary: "Updated summary" };
		expect(() => emit([changed], srcDir)).not.toThrow();
		const content = fs.readFileSync(path.join(srcDir, "commands", "feature-flags", "get.ts"), "utf-8");
		expect(content).toContain("Updated summary");
	});

	it("removes a previously generated command that no longer exists in the spec", () => {
		const srcDir = makeSrcDir();
		const stale = makeItem({
			named: { ...makeItem().named, idSegments: ["feature-flags", "list"] },
			descriptorKey: "listFeatureFlags",
		});
		emit([makeItem(), stale], srcDir);
		expect(fs.existsSync(path.join(srcDir, "commands", "feature-flags", "list.ts"))).toBe(true);

		// Re-run without the "list" operation — it must be cleaned up, not left stale.
		emit([makeItem()], srcDir);
		expect(fs.existsSync(path.join(srcDir, "commands", "feature-flags", "list.ts"))).toBe(false);
		expect(fs.existsSync(path.join(srcDir, "commands", "feature-flags", "get.ts"))).toBe(true);
	});

	it("removes directories left empty after stale generated files are cleaned up", () => {
		const srcDir = makeSrcDir();
		const onlyOpInDir = makeItem({
			named: { ...makeItem().named, idSegments: ["temporary-topic", "list"] },
			descriptorKey: "listTemporary",
		});
		emit([onlyOpInDir], srcDir);
		expect(fs.existsSync(path.join(srcDir, "commands", "temporary-topic"))).toBe(true);

		emit([], srcDir);
		expect(fs.existsSync(path.join(srcDir, "commands", "temporary-topic"))).toBe(false);
	});

	it("leaves hand-written files completely untouched during cleanup, even next to generated ones", () => {
		const srcDir = makeSrcDir();
		emit([makeItem()], srcDir);

		const handWrittenPath = path.join(srcDir, "commands", "login.ts");
		fs.writeFileSync(handWrittenPath, "// hand-written login command\nexport default class {}\n");

		// Re-run with zero operations — every *generated* file should disappear, but the
		// hand-written one must survive since it never had the banner.
		emit([], srcDir);
		expect(fs.existsSync(handWrittenPath)).toBe(true);
		expect(fs.existsSync(path.join(srcDir, "commands", "feature-flags", "get.ts"))).toBe(false);
	});
});
