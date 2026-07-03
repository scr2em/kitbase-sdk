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
}

function kindOf(type: unknown): FlagKind {
	if (type === "integer" || type === "number") return "integer";
	if (type === "boolean") return "boolean";
	return "string";
}

export function queryParamsToFlags(parameters: SpecParameter[]): FlagSpec[] {
	return parameters
		.filter((p) => p.in === "query")
		.map((p) => ({
			name: p.name,
			kind: kindOf(p.schema?.type),
			description: p.description,
			options: Array.isArray(p.schema?.enum) ? (p.schema!.enum as string[]) : undefined,
			required: p.required,
		}));
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
