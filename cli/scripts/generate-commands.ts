import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateCommands } from "./codegen/pipeline.js";

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

	try {
		const { commandFiles, includedOperations, excludedOperations } = generateCommands(specPath, srcDir);
		console.log(`Generated ${commandFiles} commands from ${includedOperations} operations (${excludedOperations} excluded).`);
	} catch (error) {
		console.error(`\n${(error as Error).message}`);
		process.exit(1);
	}
}

main();
