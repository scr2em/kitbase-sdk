import { describe, it, expect } from "vitest";
import { queryParamsToFlags, bodyFieldsToFlags } from "./flags.js";
import type { SpecParameter, BodyField } from "./spec.js";

// These tests pin down the *contract* between an OpenAPI parameter/body-field and the CLI flag
// it becomes — the business rule is "the flag name is always the literal API key with no case
// conversion" (so the runtime can send it straight through), which is easy to accidentally break
// by adding kebab-casing later.

function param(overrides: Partial<SpecParameter>): SpecParameter {
	return { name: "x", in: "query", required: false, ...overrides };
}

function bodyField(overrides: Partial<BodyField>): BodyField {
	return { name: "x", type: "string", required: false, ...overrides };
}

describe("queryParamsToFlags", () => {
	it("only includes parameters with in: query, dropping path/header/cookie params", () => {
		const flags = queryParamsToFlags([
			param({ name: "page", in: "query" }),
			param({ name: "orgSlug", in: "path" }),
			param({ name: "X-Api-Key", in: "header" }),
			param({ name: "session", in: "cookie" }),
		]);
		expect(flags.map((f) => f.name)).toEqual(["page"]);
	});

	it("maps schema type integer and number to flag kind integer", () => {
		const flags = queryParamsToFlags([
			param({ name: "page", schema: { type: "integer" } }),
			param({ name: "weight", schema: { type: "number" } }),
		]);
		expect(flags.map((f) => f.kind)).toEqual(["integer", "integer"]);
	});

	it("maps schema type boolean to flag kind boolean", () => {
		const flags = queryParamsToFlags([param({ name: "unreadOnly", schema: { type: "boolean" } })]);
		expect(flags[0].kind).toBe("boolean");
	});

	it("defaults to flag kind string for type string, missing schema, or any other type", () => {
		const flags = queryParamsToFlags([
			param({ name: "search", schema: { type: "string" } }),
			param({ name: "noSchema" }),
			param({ name: "weird", schema: { type: "array" } }),
		]);
		expect(flags.map((f) => f.kind)).toEqual(["string", "string", "string"]);
	});

	it("carries the enum values through as flag options", () => {
		const flags = queryParamsToFlags([param({ name: "sort", schema: { type: "string", enum: ["asc", "desc"] } })]);
		expect(flags[0].options).toEqual(["asc", "desc"]);
	});

	it("omits options when the schema has no enum", () => {
		const flags = queryParamsToFlags([param({ name: "search", schema: { type: "string" } })]);
		expect(flags[0].options).toBeUndefined();
	});

	it("preserves the parameter name exactly, with no case conversion (matches the API's query key verbatim)", () => {
		const flags = queryParamsToFlags([param({ name: "actorType" }), param({ name: "group_by" })]);
		expect(flags.map((f) => f.name)).toEqual(["actorType", "group_by"]);
	});

	it("passes required through unchanged", () => {
		const flags = queryParamsToFlags([param({ name: "a", required: true }), param({ name: "b", required: false })]);
		expect(flags.map((f) => f.required)).toEqual([true, false]);
	});

	it("passes the description through unchanged", () => {
		const flags = queryParamsToFlags([param({ name: "page", description: "Page number (0-based)" })]);
		expect(flags[0].description).toBe("Page number (0-based)");
	});

	// An array query param (style: form, explode: true) must stay repeatable end to end.
	// Collapsing it to a single-value flag caps the filter at one value with no error —
	// `--topicIds a --topicIds b` would silently keep only the last one.
	it("marks an array-typed query param as a repeatable (multiple) flag", () => {
		const flags = queryParamsToFlags([
			param({ name: "topicIds", schema: { type: "array", items: { type: "string" } } }),
		]);
		expect(flags[0].multiple).toBe(true);
	});

	it("leaves multiple unset for a scalar query param", () => {
		const flags = queryParamsToFlags([param({ name: "search", schema: { type: "string" } })]);
		expect(flags[0].multiple).toBeUndefined();
	});

	it("reads an array param's kind and enum off items, not the array schema", () => {
		const flags = queryParamsToFlags([
			param({ name: "ids", schema: { type: "array", items: { type: "integer" } } }),
			param({ name: "statuses", schema: { type: "array", items: { type: "string", enum: ["a", "b"] } } }),
		]);
		expect(flags[0].kind).toBe("integer");
		expect(flags[1].options).toEqual(["a", "b"]);
	});
});

describe("bodyFieldsToFlags", () => {
	it("maps body field type to flag kind the same way as query params", () => {
		const flags = bodyFieldsToFlags([
			bodyField({ name: "count", type: "integer" }),
			bodyField({ name: "weight", type: "number" }),
			bodyField({ name: "enabled", type: "boolean" }),
			bodyField({ name: "name", type: "string" }),
		]);
		expect(flags.map((f) => f.kind)).toEqual(["integer", "integer", "boolean", "string"]);
	});

	it("carries enumValues through as flag options", () => {
		const flags = bodyFieldsToFlags([bodyField({ name: "valueType", enumValues: ["boolean", "string"] })]);
		expect(flags[0].options).toEqual(["boolean", "string"]);
	});

	it("passes required through unchanged", () => {
		const flags = bodyFieldsToFlags([
			bodyField({ name: "flagKey", required: true }),
			bodyField({ name: "description", required: false }),
		]);
		expect(flags.map((f) => f.required)).toEqual([true, false]);
	});

	it("preserves the field name exactly, with no case conversion", () => {
		const flags = bodyFieldsToFlags([bodyField({ name: "flagKey" })]);
		expect(flags[0].name).toBe("flagKey");
	});
});
