import fs from "node:fs";
import { parse } from "yaml";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
const HTTP_METHODS: HttpMethod[] = ["get", "post", "put", "patch", "delete"];

export interface SpecParameter {
	name: string;
	in: "path" | "query" | "header" | "cookie";
	required: boolean;
	description?: string;
	schema?: Record<string, unknown>;
}

export interface BodyField {
	name: string;
	type: "string" | "integer" | "number" | "boolean";
	enumValues?: string[];
	description?: string;
	required: boolean;
}

export interface SpecOperation {
	path: string;
	method: HttpMethod;
	operationId: string;
	tags: string[];
	summary?: string;
	parameters: SpecParameter[];
	bodyFields: BodyField[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

function resolveRef(spec: AnyRecord, ref: string): AnyRecord {
	const parts = ref.replace(/^#\//, "").split("/");
	let node: AnyRecord = spec;
	for (const part of parts) {
		node = node[part];
	}
	return node;
}

function resolveMaybeRef(spec: AnyRecord, node: AnyRecord | undefined): AnyRecord | undefined {
	if (!node) return node;
	if (typeof node === "object" && typeof node.$ref === "string") {
		return resolveMaybeRef(spec, resolveRef(spec, node.$ref));
	}
	return node;
}

function toParameter(spec: AnyRecord, raw: AnyRecord): SpecParameter {
	const resolved = resolveMaybeRef(spec, raw) as AnyRecord;
	return {
		name: resolved.name,
		in: resolved.in,
		required: Boolean(resolved.required),
		description: resolved.description,
		schema: resolveParamSchema(spec, resolved.schema),
	};
}

/**
 * Resolves the parameter schema AND, for an array parameter, its `items` — an
 * array of a named enum (`items: {$ref: SomeEnum}`) otherwise loses its allowed
 * values, so the generated flag would silently accept anything.
 */
function resolveParamSchema(spec: AnyRecord, raw: AnyRecord | undefined): AnyRecord | undefined {
	const schema = resolveMaybeRef(spec, raw);
	if (!schema || schema.type !== "array" || !schema.items) return schema;
	return { ...schema, items: resolveMaybeRef(spec, schema.items as AnyRecord) };
}

/**
 * Extracts top-level scalar/enum request-body fields eligible to become CLI flags. Nested
 * objects/arrays and untyped ("any") fields are intentionally excluded — they're only
 * reachable via the universal `--data` flag.
 */
function extractBodyFields(spec: AnyRecord, operation: AnyRecord): BodyField[] {
	const bodySchema = resolveMaybeRef(spec, operation.requestBody?.content?.["application/json"]?.schema);
	if (!bodySchema || bodySchema.type !== "object" || !bodySchema.properties) {
		return [];
	}

	const required = new Set<string>(bodySchema.required ?? []);
	const fields: BodyField[] = [];

	for (const [name, rawProp] of Object.entries(bodySchema.properties as AnyRecord)) {
		const prop = resolveMaybeRef(spec, rawProp as AnyRecord);
		if (!prop || typeof prop !== "object") continue;

		const type = prop.type;
		if (type === "string" || type === "integer" || type === "number" || type === "boolean") {
			fields.push({
				name,
				type,
				enumValues: Array.isArray(prop.enum) ? prop.enum : undefined,
				description: prop.description,
				required: required.has(name),
			});
		}
		// object/array/untyped properties are skipped — --data only.
	}

	return fields;
}

export function loadSpec(specPath: string): SpecOperation[] {
	const spec = parse(fs.readFileSync(specPath, "utf-8")) as AnyRecord;
	const operations: SpecOperation[] = [];

	for (const [path, pathItem] of Object.entries(spec.paths as AnyRecord)) {
		const sharedParams: AnyRecord[] = (pathItem as AnyRecord).parameters ?? [];

		for (const method of HTTP_METHODS) {
			const operation = (pathItem as AnyRecord)[method];
			if (!operation) continue;

			const rawParams = [...sharedParams, ...(operation.parameters ?? [])];
			const parameters = rawParams.map((p) => toParameter(spec, p));

			operations.push({
				path,
				method,
				operationId: operation.operationId,
				tags: operation.tags ?? [],
				summary: operation.summary,
				parameters,
				bodyFields: extractBodyFields(spec, operation),
			});
		}
	}

	return operations;
}
