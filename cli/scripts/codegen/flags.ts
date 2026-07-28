import type { BodyField, SpecParameter } from "./spec.js";

export type FlagKind = "string" | "integer" | "boolean";

export interface FlagSpec {
	/** Also the exact query/body key sent to the API — no case conversion, to keep request
	 * building trivially correct even though a few spec params are camelCase (e.g. userId). */
	name: string;
	kind: FlagKind;
	description?: string;
	options?: string[];
	required: boolean;
	/** Repeatable flag (`--f a --f b`), for a query param the spec types as an array. */
	multiple?: boolean;
}

function kindOf(type: unknown): FlagKind {
	if (type === "integer" || type === "number") return "integer";
	if (type === "boolean") return "boolean";
	return "string";
}

/** An array param's kind/enum live on `items`, not on the parameter schema itself. */
function itemSchema(schema: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
	if (schema?.type !== "array") return schema;
	return schema.items as Record<string, unknown> | undefined;
}

export function queryParamsToFlags(parameters: SpecParameter[]): FlagSpec[] {
	return parameters
		.filter((p) => p.in === "query")
		.map((p) => {
			// An array query param (style: form, explode: true) has to stay an array
			// all the way to the request: collapsing it to one string silently caps
			// the filter at a single value.
			const isArray = p.schema?.type === "array";
			const items = itemSchema(p.schema);
			return {
				name: p.name,
				kind: kindOf(items?.type),
				description: p.description,
				options: Array.isArray(items?.enum) ? (items!.enum as string[]) : undefined,
				required: p.required,
				...(isArray ? { multiple: true } : {}),
			};
		});
}

export function bodyFieldsToFlags(fields: BodyField[]): FlagSpec[] {
	return fields.map((f) => ({
		name: f.name,
		kind: kindOf(f.type),
		description: f.description,
		options: f.enumValues,
		required: f.required,
	}));
}
