import fs from "node:fs/promises";

import { ValidationError } from "./errors.js";

async function readStdin(): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) {
		chunks.push(chunk as Buffer);
	}
	return Buffer.concat(chunks).toString("utf-8");
}

/** Parses the universal `--data` flag: a literal JSON object, `@file.json`, or `-` for stdin. */
export async function parseDataFlag(value: string): Promise<Record<string, unknown>> {
	let raw: string;
	if (value === "-") {
		raw = await readStdin();
	} else if (value.startsWith("@")) {
		raw = await fs.readFile(value.slice(1), "utf-8");
	} else {
		raw = value;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (error) {
		throw new ValidationError(`Invalid --data JSON: ${(error as Error).message}`);
	}

	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new ValidationError("--data must be a JSON object.");
	}

	return parsed as Record<string, unknown>;
}
