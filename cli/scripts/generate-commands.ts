import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadSpec, type HttpMethod } from "./codegen/spec.js";
import { nameOperation } from "./codegen/naming.js";
import { DENYLIST_TAGS, DENYLIST_OPERATION_IDS, ID_OVERRIDES } from "./codegen/overrides.js";
import { queryParamsToFlags, bodyFieldsToFlags } from "./codegen/flags.js";
import { emit, type EmittableOperation } from "./codegen/emit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, "..", "src");

function parseArgs(argv: string[]): { specPath: string } {
	const specFlagIndex = argv.indexOf("--spec");
	const specPath = specFlagIndex >= 0 ? argv[specFlagIndex + 1] : "../../Flyway/openapi.yaml";
	if (!specPath) {
		throw new Error("--spec requires a path argument");
	}
	return { specPath: path.resolve(process.cwd(), specPath) };
}

function main(): void {
	const { specPath } = parseArgs(process.argv.slice(2));
	console.log(`Loading spec from ${specPath}...`);
	const operations = loadSpec(specPath);

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

	if (collisions.length > 0) {
		console.error(`\nCommand id collisions (${collisions.length}) — add an entry to scripts/codegen/overrides.ts:\n`);
		for (const c of collisions) console.error(`  ${c}`);
		process.exit(1);
	}

	const { commandFiles } = emit(items, srcDir);
	console.log(`Generated ${commandFiles} commands from ${included.length} operations (${operations.length - included.length} excluded).`);
}

main();
