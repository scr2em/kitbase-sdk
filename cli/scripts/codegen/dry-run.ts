import { loadSpec } from "./spec.js";
import { buildEmittableOperations } from "./pipeline.js";

const specPath = process.argv[2] ?? "../../Flyway/openapi.yaml";
const operations = loadSpec(specPath);
const { items, includedCount, collisions } = buildEmittableOperations(operations);

for (const item of items) {
	const id = item.named.idSegments.join(" ");
	const { operation, named } = item;
	console.log(
		`${id.padEnd(55)} ${operation.method.toUpperCase().padEnd(6)} ${operation.path.padEnd(65)} org=${named.needsOrg ? "y" : "n"} proj=${named.needsProject ? "y" : "n"} args=[${named.pathParams.join(",")}] ${operation.operationId}`,
	);
}

console.log(`\nTotal included: ${includedCount}`);
if (collisions.length > 0) {
	console.log(`\nCOLLISIONS (${collisions.length}):`);
	for (const c of collisions) console.log(`  ${c}`);
	process.exitCode = 1;
} else {
	console.log("\nNo collisions.");
}
