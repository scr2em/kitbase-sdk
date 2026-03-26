import createClient from "openapi-fetch";
import type { paths as SdkPaths } from "../generated/sdk-api.js";
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
 * For standard JSON endpoints. The push command uses the custom
 * UploadClient for multipart uploads with progress tracking.
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
