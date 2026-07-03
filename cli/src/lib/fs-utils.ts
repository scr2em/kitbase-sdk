import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Reads and JSON-parses a file, returning `fallback` if it doesn't exist or fails to parse
 * (a corrupt config file shouldn't crash the CLI — it should behave as if unset).
 */
export function readJsonFile<T>(filePath: string, fallback: T): T {
	try {
		const raw = fs.readFileSync(filePath, "utf-8");
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

/**
 * Writes JSON to `filePath` atomically (write to a temp file, then rename) so a crash
 * mid-write can never leave a truncated/corrupt config or credentials file behind.
 */
export function writeJsonFileAtomic(filePath: string, data: unknown, mode: number): void {
	const dir = path.dirname(filePath);
	fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

	const tmpFile = path.join(dir, `.${path.basename(filePath)}.${randomBytes(6).toString("hex")}.tmp`);
	fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), { mode });
	fs.renameSync(tmpFile, filePath);
}
