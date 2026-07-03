import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { loadSpec } from "./spec.js";

// These tests assert what loadSpec *should* produce for a given OpenAPI shape — the business
// rule being verified is "which request-body properties are safe to expose as CLI flags",
// not merely a record of whatever the current implementation happens to return.

const tmpFiles: string[] = [];

function writeSpec(yaml: string): string {
	const file = path.join(os.tmpdir(), `kitbase-cli-spec-test-${Date.now()}-${Math.random().toString(36).slice(2)}.yaml`);
	fs.writeFileSync(file, yaml);
	tmpFiles.push(file);
	return file;
}

afterEach(() => {
	for (const file of tmpFiles.splice(0)) {
		fs.rmSync(file, { force: true });
	}
});

describe("loadSpec", () => {
	it("extracts one operation per HTTP method defined on a path", () => {
		const file = writeSpec(`
paths:
  /widgets:
    get:
      operationId: listWidgets
      tags: [Widgets]
      summary: List widgets
    post:
      operationId: createWidget
      tags: [Widgets]
      summary: Create widget
`);
		const operations = loadSpec(file);

		expect(operations).toHaveLength(2);
		expect(operations.map((o) => o.operationId).sort()).toEqual(["createWidget", "listWidgets"]);
		expect(operations.find((o) => o.operationId === "listWidgets")).toMatchObject({
			path: "/widgets",
			method: "get",
			tags: ["Widgets"],
			summary: "List widgets",
		});
	});

	it("defaults tags to an empty array when the operation has none", () => {
		const file = writeSpec(`
paths:
  /ping:
    get:
      operationId: ping
`);
		const [operation] = loadSpec(file);
		expect(operation.tags).toEqual([]);
	});

	it("merges path-item-level shared parameters with operation-level parameters", () => {
		const file = writeSpec(`
paths:
  /{orgSlug}/widgets/{widgetId}:
    parameters:
      - name: orgSlug
        in: path
        required: true
        schema: { type: string }
    get:
      operationId: getWidget
      parameters:
        - name: widgetId
          in: path
          required: true
          schema: { type: string }
        - name: include
          in: query
          required: false
          schema: { type: string }
`);
		const [operation] = loadSpec(file);
		const paramNames = operation.parameters.map((p) => `${p.name}:${p.in}`).sort();

		// The shared orgSlug param must appear alongside the operation's own params — dropping
		// path-item-level parameters would silently break every org/project-scoped endpoint.
		expect(paramNames).toEqual(["include:query", "orgSlug:path", "widgetId:path"]);
	});

	it("resolves a $ref'd parameter to its underlying name/in/required/schema", () => {
		const file = writeSpec(`
paths:
  /{orgSlug}/widgets:
    get:
      operationId: listWidgets
      parameters:
        - $ref: '#/components/parameters/OrgSlugPath'
components:
  parameters:
    OrgSlugPath:
      name: orgSlug
      in: path
      required: true
      description: Organization slug
      schema: { type: string }
`);
		const [operation] = loadSpec(file);
		expect(operation.parameters).toEqual([
			{
				name: "orgSlug",
				in: "path",
				required: true,
				description: "Organization slug",
				schema: { type: "string" },
			},
		]);
	});

	it("returns no body fields when the operation has no request body", () => {
		const file = writeSpec(`
paths:
  /widgets:
    get:
      operationId: listWidgets
`);
		const [operation] = loadSpec(file);
		expect(operation.bodyFields).toEqual([]);
	});

	describe("request body field extraction", () => {
		const specWithBody = (schemaYaml: string) =>
			writeSpec(`
paths:
  /widgets:
    post:
      operationId: createWidget
      requestBody:
        content:
          application/json:
            schema:
${schemaYaml}
`);

		it("includes top-level scalar properties (string/integer/number/boolean) as body fields", () => {
			const file = specWithBody(`
              type: object
              properties:
                name: { type: string, description: "Widget name" }
                count: { type: integer }
                weight: { type: number }
                enabled: { type: boolean }`);
			const [operation] = loadSpec(file);
			const byName = Object.fromEntries(operation.bodyFields.map((f) => [f.name, f]));

			expect(Object.keys(byName).sort()).toEqual(["count", "enabled", "name", "weight"]);
			expect(byName.name).toMatchObject({ type: "string", description: "Widget name" });
			expect(byName.count).toMatchObject({ type: "integer" });
			expect(byName.weight).toMatchObject({ type: "number" });
			expect(byName.enabled).toMatchObject({ type: "boolean" });
		});

		it("marks fields listed in the schema's `required` array as required, others as not", () => {
			const file = specWithBody(`
              type: object
              required: [name]
              properties:
                name: { type: string }
                description: { type: string }`);
			const [operation] = loadSpec(file);
			const byName = Object.fromEntries(operation.bodyFields.map((f) => [f.name, f.required]));

			expect(byName.name).toBe(true);
			expect(byName.description).toBe(false);
		});

		it("captures enum values declared directly on a property", () => {
			const file = specWithBody(`
              type: object
              properties:
                sort: { type: string, enum: [asc, desc] }`);
			const [operation] = loadSpec(file);
			expect(operation.bodyFields[0]).toMatchObject({ name: "sort", enumValues: ["asc", "desc"] });
		});

		it("resolves a $ref'd property that points to a scalar enum schema as an enum field", () => {
			const file = writeSpec(`
paths:
  /widgets:
    post:
      operationId: createWidget
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                valueType:
                  $ref: '#/components/schemas/ValueTypeEnum'
components:
  schemas:
    ValueTypeEnum:
      type: string
      enum: [boolean, string, number]
`);
			const [operation] = loadSpec(file);
			expect(operation.bodyFields).toEqual([
				expect.objectContaining({ name: "valueType", type: "string", enumValues: ["boolean", "string", "number"] }),
			]);
		});

		it("excludes array properties — they're only reachable via --data, never a scalar flag", () => {
			const file = specWithBody(`
              type: object
              properties:
                name: { type: string }
                tags: { type: array, items: { type: string } }`);
			const [operation] = loadSpec(file);
			expect(operation.bodyFields.map((f) => f.name)).toEqual(["name"]);
		});

		it("excludes nested object properties", () => {
			const file = specWithBody(`
              type: object
              properties:
                name: { type: string }
                metadata: { type: object }`);
			const [operation] = loadSpec(file);
			expect(operation.bodyFields.map((f) => f.name)).toEqual(["name"]);
		});

		it("excludes a $ref'd property that resolves to an object schema", () => {
			const file = writeSpec(`
paths:
  /widgets:
    post:
      operationId: createWidget
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                owner:
                  $ref: '#/components/schemas/OwnerRef'
components:
  schemas:
    OwnerRef:
      type: object
      properties:
        id: { type: string }
`);
			const [operation] = loadSpec(file);
			expect(operation.bodyFields.map((f) => f.name)).toEqual(["name"]);
		});

		it("excludes untyped properties (no type, no $ref) — ambiguous, --data only", () => {
			const file = specWithBody(`
              type: object
              properties:
                name: { type: string }
                value: { description: "type depends on valueType" }`);
			const [operation] = loadSpec(file);
			expect(operation.bodyFields.map((f) => f.name)).toEqual(["name"]);
		});

		it("resolves a $ref'd request body schema itself (not just properties)", () => {
			const file = writeSpec(`
paths:
  /widgets:
    post:
      operationId: createWidget
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateWidgetRequest'
components:
  schemas:
    CreateWidgetRequest:
      type: object
      required: [name]
      properties:
        name: { type: string }
`);
			const [operation] = loadSpec(file);
			expect(operation.bodyFields).toEqual([expect.objectContaining({ name: "name", required: true })]);
		});
	});
});
