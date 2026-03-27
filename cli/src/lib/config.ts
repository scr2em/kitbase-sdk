import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { inputText, confirmPrompt } from "./prompts.js";

const CONFIG_FILE_NAME = ".kitbasecli";
const DEFAULT_BASE_URL = "https://api.kitbase.dev";

export const SECRET_KEY_PREFIX = "sk_kitbase_";
export const PUBLIC_KEY_PREFIX = "pk_kitbase_";

export function isSecretKey(key: string): boolean {
	return key.startsWith(SECRET_KEY_PREFIX);
}

export function isPublicKey(key: string): boolean {
	return key.startsWith(PUBLIC_KEY_PREFIX);
}

const CONFIG_TEMPLATE = `KITBASE_API_KEY=`;

const CONFIG_TEMPLATE_WITH_URL = (apiKey: string, apiUrl: string) =>
	`KITBASE_API_KEY=${apiKey}
KITBASE_API_URL=${apiUrl}
`;

export function getConfigPath(): string {
	return join(process.cwd(), CONFIG_FILE_NAME);
}

export function configExists(): boolean {
	return existsSync(getConfigPath());
}

/**
 * Read a value from the .kitbasecli config file by key name.
 */
function readConfigValue(key: string): string | null {
	const configPath = getConfigPath();
	if (!existsSync(configPath)) return null;

	try {
		const content = readFileSync(configPath, "utf-8");
		for (const line of content.split("\n")) {
			const trimmed = line.trim();
			if (trimmed.startsWith("#") || trimmed === "") continue;

			if (trimmed.startsWith(`${key}=`)) {
				const value = trimmed.substring(key.length + 1).trim();
				if (
					(value.startsWith('"') && value.endsWith('"')) ||
					(value.startsWith("'") && value.endsWith("'"))
				) {
					return value.slice(1, -1);
				}
				return value || null;
			}
		}
		return null;
	} catch {
		return null;
	}
}

export function readApiKeyFromConfig(): string | null {
	return readConfigValue("KITBASE_API_KEY");
}

export function readApiUrlFromConfig(): string | null {
	return readConfigValue("KITBASE_API_URL");
}

/**
 * Write config file with API key and optional API URL.
 */
export function writeConfig(apiKey: string, apiUrl?: string): void {
	const normalizedUrl = apiUrl ? stripTrailingSlash(apiUrl) : undefined;
	const content = normalizedUrl
		? CONFIG_TEMPLATE_WITH_URL(apiKey, normalizedUrl)
		: CONFIG_TEMPLATE + apiKey + "\n";
	writeFileSync(getConfigPath(), content, "utf-8");
}

// Keep backward compat alias
export function writeApiKeyToConfig(apiKey: string): void {
	const existingUrl = readApiUrlFromConfig();
	writeConfig(apiKey, existingUrl ?? undefined);
}

/**
 * Ensure .kitbasecli is in .gitignore. Creates .gitignore if it doesn't exist.
 */
export function ensureGitignore(): { created: boolean; added: boolean } {
	const gitignorePath = join(process.cwd(), ".gitignore");
	const entry = ".kitbasecli";

	if (existsSync(gitignorePath)) {
		const content = readFileSync(gitignorePath, "utf-8");
		if (content.includes(entry)) {
			return { created: false, added: false };
		}

		const separator = content.endsWith("\n") ? "" : "\n";
		writeFileSync(gitignorePath, content + `${separator}\n# Kitbase CLI config\n${entry}\n`, "utf-8");
		return { created: false, added: true };
	}

	writeFileSync(gitignorePath, `# Kitbase CLI config\n${entry}\n`, "utf-8");
	return { created: true, added: true };
}

/**
 * Resolve the API base URL.
 * Priority: CLI flag > env var > config file > default
 */
function stripTrailingSlash(url: string): string {
	return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getBaseUrl(cliBaseUrl?: string): string {
	const url = cliBaseUrl ?? process.env.KITBASE_API_URL ?? readApiUrlFromConfig() ?? DEFAULT_BASE_URL;
	return stripTrailingSlash(url);
}

/**
 * Get API key from all sources.
 * Priority: CLI arg > env var > config file > interactive prompt
 */
export async function getApiKey(options?: {
	interactive?: boolean;
	cliApiKey?: string;
}): Promise<string | null> {
	if (options?.cliApiKey) {
		const existing = readApiKeyFromConfig();
		if (!existing || existing !== options.cliApiKey) {
			if (process.stdin.isTTY) {
				const save = await confirmPrompt("Save API key to .kitbasecli for future use?");
				if (save) {
					writeApiKeyToConfig(options.cliApiKey);
					ensureGitignore();
					console.log(chalk.dim("  Saved to .kitbasecli"));
				}
			}
		}
		return options.cliApiKey;
	}

	const envKey = process.env.KITBASE_API_KEY;
	if (envKey) return envKey;

	const configKey = readApiKeyFromConfig();
	if (configKey) return configKey;

	if (options?.interactive !== false && process.stdin.isTTY) {
		console.log("\nNo API key found. Let's set one up!\n");
		console.log("You need a secret key (sk_kitbase_*) — these are per-project, not per-environment.");
		console.log("Find your API key in your project settings at: https://kitbase.dev\n");

		const apiKey = await inputText("Paste your API key", {
			validate: (v) => {
				if (!v) return "API key is required";
				if (v.length < 10) return "Invalid API key format";
				return true;
			},
		});

		if (apiKey) {
			const save = await confirmPrompt("Save API key to .kitbasecli for future use?");
			if (save) {
				writeApiKeyToConfig(apiKey);
				ensureGitignore();
				console.log(chalk.dim("  Saved to .kitbasecli"));
			}
			return apiKey;
		}
	}

	return null;
}
