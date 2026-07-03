import createClient from "openapi-fetch";

import type { paths } from "../generated/api.js";
import { resolveBaseUrl, type BaseUrlFlags } from "./config.js";
import { getValidAccessToken, forceRefreshAccessToken } from "./auth.js";
import { ApiError, AuthenticationError } from "./errors.js";

export interface ApiClientOptions extends BaseUrlFlags {
	apiKey?: string;
}

export interface ApiClient {
	client: ReturnType<typeof createClient<paths>>;
	baseUrl: string;
}

/**
 * Builds a typed API client for `baseUrl`, authenticated either with a private API key
 * (`sk_kitbase_...`, sent as-is — CI/CD credential, never refreshed) or with the stored CLI
 * login session (JWT access token, refreshed transparently).
 */
export function createApiClient(options: ApiClientOptions = {}): ApiClient {
	const baseUrl = resolveBaseUrl(options);
	const apiKey = options.apiKey ?? process.env.KITBASE_API_KEY;
	const client = createClient<paths>({ baseUrl });

	client.use({
		async onRequest({ request }) {
			if (apiKey) {
				request.headers.set("Authorization", `Bearer ${apiKey}`);
				return request;
			}

			const token = await getValidAccessToken(baseUrl);
			if (!token) {
				throw new AuthenticationError("Not logged in. Run `kitbase login` first.");
			}
			request.headers.set("Authorization", `Bearer ${token}`);
			return request;
		},

		async onResponse({ request, response }) {
			// API-key auth doesn't refresh — a 401 there means the key itself is bad.
			if (apiKey || response.status !== 401) {
				return response;
			}

			const refreshedToken = await forceRefreshAccessToken(baseUrl);
			if (!refreshedToken) {
				return response;
			}

			const retryRequest = request.clone();
			retryRequest.headers.set("Authorization", `Bearer ${refreshedToken}`);
			return fetch(retryRequest);
		},
	});

	return { client, baseUrl };
}

interface FetchResult<T> {
	data?: T;
	error?: unknown;
	response: Response;
}

/** Unwraps an openapi-fetch result, throwing a typed `ApiError` on any non-2xx response. */
export function unwrapResponse<T>(result: FetchResult<T>): T {
	if (result.error !== undefined || !result.response.ok) {
		throw new ApiError(
			extractApiErrorMessage(result.error) ?? `Request failed with status ${result.response.status}`,
			result.response.status,
			result.error,
			result.response.url,
		);
	}
	return result.data as T;
}

function extractApiErrorMessage(error: unknown): string | undefined {
	if (error && typeof error === "object" && "error" in error) {
		const inner = (error as { error?: unknown }).error;
		if (inner && typeof inner === "object" && "message" in inner) {
			return String((inner as { message?: unknown }).message);
		}
	}
	return undefined;
}
