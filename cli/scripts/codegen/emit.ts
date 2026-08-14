import fs from "node:fs";
import path from "node:path";

import type { HttpMethod, SpecOperation } from "./spec.js";
import type { NamedOperation } from "./naming.js";
import { queryParamsToFlags, bodyFieldsToFlags, type FlagSpec } from "./flags.js";

export const GENERATED_BANNER = "// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.";

export interface EmittableOperation {
	named: NamedOperation;
	operation: SpecOperation;
	descriptorKey: string;
	queryFlags: FlagSpec[];
	bodyFlags: FlagSpec[];
}

function toDescriptorKey(operationId: string): string {
	return operationId;
}

/**
 * Recursively deletes any previously generated (banner-marked) command file under `dir`, so a
 * spec change that removes/renames an operation doesn't leave a stale command behind. Files
 * without the banner (hand-written commands like login.ts) are left untouched — collision with
 * a freshly-generated file is caught at write time in `emit()`, not here.
 */
function cleanGeneratedCommands(dir: string): void {
	if (!fs.existsSync(dir)) return;

	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const entryPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			cleanGeneratedCommands(entryPath);
			if (fs.readdirSync(entryPath).length === 0) {
				fs.rmdirSync(entryPath);
			}
		} else if (entry.isFile()) {
			const content = fs.readFileSync(entryPath, "utf-8");
			if (content.startsWith(GENERATED_BANNER)) {
				fs.unlinkSync(entryPath);
			}
		}
	}
}

export function flagLiteral(flag: FlagSpec, enforceRequired: boolean): string {
	const oclifType = flag.kind === "integer" ? "Flags.integer" : flag.kind === "boolean" ? "Flags.boolean" : "Flags.string";
	const props: string[] = [];
	if (flag.description) props.push(`description: ${JSON.stringify(flag.description)}`);
	// oclif checks `options` against the raw string the user typed, before any
	// parsing, so its type is string[] whatever the flag parses to. An integer
	// enum (`resultLimit: [150, 300, 500]`) emitted as numbers does not compile.
	if (flag.options && flag.options.length > 0) {
		props.push(`options: ${JSON.stringify(flag.options.map((option) => String(option)))}`);
	}
	if (flag.multiple) props.push("multiple: true");
	// Body-field flags are never oclif-`required`, even when the schema marks them required —
	// `--data`/stdin is an equally valid way to supply them, and operation-command.ts already
	// enforces required body fields itself (with a TTY prompt fallback) after merging --data.
	if (flag.required && enforceRequired) props.push("required: true");
	return `${oclifType}({ ${props.join(", ")} })`;
}

export function argLiteral(name: string, description: string | undefined): string {
	// oclif only renders the ARGUMENTS help section when at least one arg has a description, so
	// always provide a fallback rather than leaving positional args undocumented in --help.
	const props = [`description: ${JSON.stringify(description ?? name)}`, "required: true"];
	return `Args.string({ ${props.join(", ")} })`;
}

export function relativeImportFromCommand(commandDir: string, targetRelativeToSrc: string): string {
	// The file lives at src/commands/<commandDir>/<file>.ts, so escaping back to src/ means
	// climbing out of "commands/" (1 level) plus every segment of commandDir.
	const depth = 1 + (commandDir === "." ? 0 : commandDir.split("/").length);
	return `${"../".repeat(depth)}${targetRelativeToSrc}`;
}

export function renderCommandFile(item: EmittableOperation, commandDir: string, className: string): string {
	const flagEntries = [
		...item.queryFlags.map((f) => `\t\t${JSON.stringify(f.name)}: ${flagLiteral(f, true)},`),
		...item.bodyFlags.map((f) => `\t\t${JSON.stringify(f.name)}: ${flagLiteral(f, false)},`),
	].join("\n");
	const argEntries = item.named.pathParams
		.map((name) => {
			const param = item.operation.parameters.find((p) => p.name === name);
			return `\t\t${JSON.stringify(name)}: ${argLiteral(name, param?.description)},`;
		})
		.join("\n");

	const runtimeImport = relativeImportFromCommand(commandDir, "runtime/operation-command.js");
	const descriptorsImport = relativeImportFromCommand(commandDir, "generated/descriptors.js");

	const summary = item.operation.summary ?? item.operation.operationId;

	return `${GENERATED_BANNER}
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "${runtimeImport}";
import { descriptors } from "${descriptorsImport}";

export default class ${className} extends ApiOperationCommand {
	static description = ${JSON.stringify(summary)};
${argEntries ? `\tstatic args = {\n${argEntries}\n\t};\n` : ""}${flagEntries ? `\tstatic flags = {\n${flagEntries}\n\t};\n` : ""}
	descriptor = descriptors[${JSON.stringify(item.descriptorKey)}];
}
`;
}

export function toClassName(idSegments: string[]): string {
	return idSegments
		.map((seg) =>
			seg
				.split("-")
				.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
				.join(""),
		)
		.join("");
}

export function renderDescriptorsFile(items: EmittableOperation[]): string {
	const entries = items
		.map((item) => {
			const d = item.named;
			return `\t${JSON.stringify(item.descriptorKey)}: {
\t\tmethod: ${JSON.stringify(item.operation.method)},
\t\tpath: ${JSON.stringify(item.operation.path)},
\t\tneedsOrg: ${d.needsOrg},
\t\tneedsProject: ${d.needsProject},
\t\tpathParams: ${JSON.stringify(d.pathParams)},
\t\tqueryParams: ${JSON.stringify(item.queryFlags.map((f) => f.name))},
\t\tbodyFields: ${JSON.stringify(item.bodyFlags.map((f) => f.name))},
\t\trequiredBodyFields: ${JSON.stringify(item.bodyFlags.filter((f) => f.required).map((f) => f.name))},
\t},`;
		})
		.join("\n");

	return `${GENERATED_BANNER}
import type { OperationDescriptor } from "../runtime/descriptor.js";

export const descriptors: Record<string, OperationDescriptor> = {
${entries}
};
`;
}

export function emit(items: EmittableOperation[], srcDir: string): { commandFiles: number } {
	const commandsDir = path.join(srcDir, "commands");
	const generatedDir = path.join(srcDir, "generated");

	cleanGeneratedCommands(commandsDir);
	fs.mkdirSync(commandsDir, { recursive: true });
	fs.mkdirSync(generatedDir, { recursive: true });

	for (const item of items) {
		const idSegments = item.named.idSegments;
		const commandDir = idSegments.slice(0, -1).join("/") || ".";
		const fileName = `${idSegments.at(-1)}.ts`;
		const fullDir = path.join(commandsDir, commandDir === "." ? "" : commandDir);
		fs.mkdirSync(fullDir, { recursive: true });

		const targetPath = path.join(fullDir, fileName);
		if (fs.existsSync(targetPath) && !fs.readFileSync(targetPath, "utf-8").startsWith(GENERATED_BANNER)) {
			throw new Error(
				`Generated command "${idSegments.join(" ")}" collides with a hand-written file: ${targetPath}\n` +
					"Add an entry to scripts/codegen/overrides.ts to rename the generated command, or rename the hand-written one.",
			);
		}

		const className = toClassName(idSegments);
		const content = renderCommandFile(item, commandDir, className);
		fs.writeFileSync(targetPath, content);
	}

	fs.writeFileSync(path.join(generatedDir, "descriptors.ts"), renderDescriptorsFile(items));

	return { commandFiles: items.length };
}

export { toDescriptorKey };
export type { HttpMethod };
