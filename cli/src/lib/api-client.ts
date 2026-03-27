import createClient from "openapi-fetch";
import type { paths as CliPaths } from "../generated/cli-api.js";
import type { paths as ApiPaths } from "../generated/api.js";
import { getBaseUrl } from "./config.js";

/**
 * Type-safe client for CLI-exclusive endpoints (X-API-Key auth).
 *
 * For endpoints defined in openapi-cli.yaml: key-info, build uploads.
 */
export function createCliClient(apiKey: string, baseUrl?: string) {
	return createClient<CliPaths>({
		baseUrl: baseUrl ?? getBaseUrl(),
		headers: { "X-API-Key": apiKey },
	});
}

/**
 * Type-safe client for the main Kitbase API (X-API-Key auth).
 *
 * For shared endpoints defined in openapi.yaml: builds, environments, OTA updates, etc.
 */
export function createApiClient(apiKey: string, baseUrl?: string) {
	return createClient<ApiPaths>({
		baseUrl: baseUrl ?? getBaseUrl(),
		headers: { "X-API-Key": apiKey },
	});
}
