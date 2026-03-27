import createClient from "openapi-fetch";
import type { paths as SdkPaths } from "../generated/sdk-api.js";
import type { paths as CliPaths } from "../generated/cli-api.js";
import { getBaseUrl } from "./config.js";

// Dashboard API types not yet available (broken $refs in openapi.yaml Flutter section).
// Once fixed, run `pnpm generate:types:dashboard` and uncomment:
// import type {paths as DashboardPaths} from '../generated/api.js';

/**
 * Create a type-safe client for the Kitbase Dashboard API (bearer token auth).
 *
 * Once dashboard types are generated:
 * ```ts
 * const client = createDashboardClient<DashboardPaths>(token);
 * const {data} = await client.GET('/{orgSlug}/api/projects');
 * ```
 */
export function createDashboardClient<Paths extends {}>(token: string, baseUrl?: string) {
	return createClient<Paths>({
		baseUrl: baseUrl ?? getBaseUrl(),
		headers: { Authorization: `Bearer ${token}` },
	});
}

/**
 * Type-safe client for the Kitbase SDK API (X-API-Key auth).
 *
 * For standard JSON endpoints used by mobile/web SDKs.
 *
 * ```ts
 * const client = createSdkClient(apiKey);
 * const {data} = await client.POST('/sdk/v1/ota/check', { body: { ... } });
 * ```
 */
export function createSdkClient(apiKey: string, baseUrl?: string) {
	return createClient<SdkPaths>({
		baseUrl: baseUrl ?? getBaseUrl(),
		headers: { "X-API-Key": apiKey },
	});
}

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
