import createClient from "openapi-fetch";
import type { paths as CliPaths } from "../generated/cli-api.js";
import { getBaseUrl } from "./config.js";

/**
 * Type-safe client for the Kitbase CLI API (X-API-Key auth).
 *
 * For CLI-specific endpoints: key-info, environments, build uploads.
 *
 * ```ts
 * const client = createCliClient(apiKey);
 * const {data} = await client.GET('/api/v1/auth/environments');
 * ```
 */
export function createCliClient(apiKey: string, baseUrl?: string) {
	return createClient<CliPaths>({
		baseUrl: baseUrl ?? getBaseUrl(),
		headers: { "X-API-Key": apiKey },
	});
}
