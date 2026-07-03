import { CONFIG_FILE } from "./paths.js";
import { readJsonFile, writeJsonFileAtomic } from "./fs-utils.js";
import { normalizeBaseUrl } from "./url.js";

const DEFAULT_BASE_URL = "https://api.kitbase.dev";
// Matches the Flyway backend's default "dev" Spring profile (server.port 8100, context-path
// /api) — NOT the port the OpenAPI spec's `servers:` block claims (that's stale/aspirational).
const LOCAL_BASE_URL = "http://localhost:8100/api";

export interface Context {
	org?: string;
	project?: string;
}

interface ConfigFile {
	baseUrl?: string;
	contexts?: Record<string, Context>;
}

function readConfig(): ConfigFile {
	return readJsonFile<ConfigFile>(CONFIG_FILE, {});
}

function writeConfig(config: ConfigFile): void {
	writeJsonFileAtomic(CONFIG_FILE, config, 0o600);
}

export interface BaseUrlFlags {
	baseUrl?: string;
	local?: boolean;
}

/**
 * Resolves the API base URL: `--base-url` flag > `--local` flag > `KITBASE_API_URL` env >
 * saved config default > production. Always normalized (no trailing slash) since every
 * caller concatenates paths onto it directly.
 */
export function resolveBaseUrl(flags: BaseUrlFlags = {}): string {
	if (flags.baseUrl) {
		return normalizeBaseUrl(flags.baseUrl);
	}
	if (flags.local) {
		return normalizeBaseUrl(LOCAL_BASE_URL);
	}
	if (process.env.KITBASE_API_URL) {
		return normalizeBaseUrl(process.env.KITBASE_API_URL);
	}
	const saved = readConfig().baseUrl;
	if (saved) {
		return normalizeBaseUrl(saved);
	}
	return DEFAULT_BASE_URL;
}

export function setDefaultBaseUrl(baseUrl: string): void {
	const config = readConfig();
	config.baseUrl = normalizeBaseUrl(baseUrl);
	writeConfig(config);
}

export function getContext(baseUrl: string): Context {
	return readConfig().contexts?.[baseUrl] ?? {};
}

export function setContext(baseUrl: string, patch: Context): void {
	const config = readConfig();
	config.contexts ??= {};
	config.contexts[baseUrl] = { ...config.contexts[baseUrl], ...patch };
	writeConfig(config);
}
