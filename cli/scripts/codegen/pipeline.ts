import { loadSpec, type HttpMethod, type SpecOperation } from "./spec.js";
import { nameOperation } from "./naming.js";
import { DENYLIST_TAGS, DENYLIST_OPERATION_IDS, ID_OVERRIDES } from "./overrides.js";
import { queryParamsToFlags, bodyFieldsToFlags } from "./flags.js";
import { emit, type EmittableOperation } from "./emit.js";

export interface BuildResult {
	items: EmittableOperation[];
	includedCount: number;
	excludedCount: number;
	/** Human-readable descriptions of any command-id collisions found (empty when none). */
	collisions: string[];
}

/**
 * Applies the denylist, naming rules, and ID_OVERRIDES to a raw operation list, and detects
 * command-id collisions. Pure — no filesystem access — so it's fast and deterministic to test
 * independent of `emit()`'s side effects.
 */
export function buildEmittableOperations(operations: SpecOperation[]): BuildResult {
	const methodsByPath = new Map<string, Set<HttpMethod>>();
	for (const op of operations) {
		if (!methodsByPath.has(op.path)) methodsByPath.set(op.path, new Set());
		methodsByPath.get(op.path)!.add(op.method);
	}

	const included = operations.filter(
		(op) => !op.tags.some((t) => DENYLIST_TAGS.has(t)) && !DENYLIST_OPERATION_IDS.has(op.operationId),
	);

	const items: EmittableOperation[] = [];
	const idsSeen = new Map<string, string>();
	const collisions: string[] = [];

	for (const operation of included) {
		const named = nameOperation(operation, methodsByPath.get(operation.path)!);
		const idSegments = ID_OVERRIDES[operation.operationId] ?? named.idSegments;
		named.idSegments = idSegments;

		const id = idSegments.join(" ");
		const previousOperationId = idsSeen.get(id);
		if (previousOperationId) {
			collisions.push(`"${id}": ${previousOperationId} vs ${operation.operationId}`);
		}
		idsSeen.set(id, operation.operationId);

		items.push({
			named,
			operation,
			descriptorKey: operation.operationId,
			queryFlags: queryParamsToFlags(operation.parameters),
			bodyFlags: bodyFieldsToFlags(operation.bodyFields),
		});
	}

	return { items, includedCount: included.length, excludedCount: operations.length - included.length, collisions };
}

export interface GenerateResult {
	commandFiles: number;
	includedOperations: number;
	excludedOperations: number;
}

/**
 * The full pipeline: load the spec, apply naming/overrides, and emit command files. Throws
 * (rather than exiting the process) on any unresolved id collision, so callers — the CLI
 * entrypoint or a test — decide how to report/handle it.
 */
export function generateCommands(specPath: string, srcDir: string): GenerateResult {
	const operations = loadSpec(specPath);
	const { items, includedCount, excludedCount, collisions } = buildEmittableOperations(operations);

	if (collisions.length > 0) {
		throw new Error(
			`Command id collisions (${collisions.length}) — add an entry to scripts/codegen/overrides.ts:\n` +
				collisions.map((c) => `  ${c}`).join("\n"),
		);
	}

	const { commandFiles } = emit(items, srcDir);
	return { commandFiles, includedOperations: includedCount, excludedOperations: excludedCount };
}
