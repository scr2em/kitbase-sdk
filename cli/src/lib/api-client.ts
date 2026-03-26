import createClient from "openapi-fetch";
import type { paths as SdkPaths } from "../generated/sdk-api.js";

// Dashboard API types not yet available (broken $refs in openapi.yaml Flutter section).
// Once fixed, run `pnpm generate:types:dashboard` and uncomment:
// import type {paths as DashboardPaths} from '../generated/api.js';

const DEFAULT_BASE_URL = process.env.KITBASE_API_URL || "https://api.kitbase.dev";

/**
 * Create a type-safe client for the Kitbase Dashboard API (bearer token auth).
 *
 * Once dashboard types are generated:
 * ```ts
 * const client = createDashboardClient<DashboardPaths>(token);
 * const {data} = await client.GET('/{orgSlug}/api/projects');
 * ```
 */
export function createDashboardClient<Paths extends {}>(token: string, baseUrl = DEFAULT_BASE_URL) {
	return createClient<Paths>({
		baseUrl,
		headers: { Authorization: `Bearer ${token}` },
	});
}

/**
 * Type-safe client for the Kitbase SDK API (x-sdk-key auth).
 *
 * For standard JSON endpoints. The push command uses the custom
 * UploadClient for multipart uploads with progress tracking.
 *
 * ```ts
 * const client = createSdkClient(apiKey);
 * const {data} = await client.POST('/sdk/v1/ota/check', { body: { ... } });
 * ```
 */
export function createSdkClient(apiKey: string, baseUrl = DEFAULT_BASE_URL) {
	return createClient<SdkPaths>({
		baseUrl,
		headers: { "x-sdk-key": apiKey },
	});
}