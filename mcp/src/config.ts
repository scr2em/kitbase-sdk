import { normalizeBaseUrl } from "./lib/url.js";

// Package identity advertised to MCP clients.
export const SERVICE_NAME = "kitbase-mcp";
export const SERVICE_VERSION = "0.1.0";

// The public Kitbase product API. Default is production; override with
// KITBASE_API_URL for local/self-hosted backends. Always normalized (no
// trailing slash) since callers concatenate paths directly.
const DEFAULT_API_URL = "https://api.kitbase.dev";

export function resolveApiBaseUrl(): string {
	const fromEnv = process.env.KITBASE_API_URL;
	return normalizeBaseUrl(fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_API_URL);
}
