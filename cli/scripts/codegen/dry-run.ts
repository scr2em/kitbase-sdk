import { loadSpec, type HttpMethod } from "./spec.js";
import { nameOperation } from "./naming.js";
import { DENYLIST_TAGS, DENYLIST_OPERATION_IDS, ID_OVERRIDES } from "./overrides.js";

const specPath = process.argv[2] ?? "../../Flyway/openapi.yaml";
const operations = loadSpec(specPath);

const methodsByPath = new Map<string, Set<HttpMethod>>();
for (const op of operations) {
	if (!methodsByPath.has(op.path)) methodsByPath.set(op.path, new Set());
	methodsByPath.get(op.path)!.add(op.method);
}

const included = operations.filter(
	(op) => !op.tags.some((t) => DENYLIST_TAGS.has(t)) && !DENYLIST_OPERATION_IDS.has(op.operationId),
);

const byId = new Map<string, string[]>();
const collisions: string[] = [];

for (const op of included) {
	const named = nameOperation(op, methodsByPath.get(op.path)!);
	const idSegments = ID_OVERRIDES[op.operationId] ?? named.idSegments;
	const id = idSegments.join(" ");

	if (!byId.has(id)) byId.set(id, []);
	byId.get(id)!.push(op.operationId);

	console.log(
		`${id.padEnd(55)} ${op.method.toUpperCase().padEnd(6)} ${op.path.padEnd(65)} org=${named.needsOrg ? "y" : "n"} proj=${named.needsProject ? "y" : "n"} args=[${named.pathParams.join(",")}] ${op.operationId}`,
	);
}

console.log(`\nTotal included: ${included.length}`);
for (const [id, ops] of byId) {
	if (ops.length > 1) {
		collisions.push(`${id}: ${ops.join(", ")}`);
	}
}

if (collisions.length > 0) {
	console.log(`\nCOLLISIONS (${collisions.length}):`);
	for (const c of collisions) console.log(`  ${c}`);
	process.exitCode = 1;
} else {
	console.log("\nNo collisions.");
}
