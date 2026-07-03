import createClient from "openapi-fetch";

import type { paths } from "../generated/api.js";
import { resolveApiBaseUrl } from "../config.js";

export type KitbaseClient = ReturnType<typeof createClient<paths>>;

/**
 * A typed Kitbase API client authenticated with a bearer token — either a user
 * JWT (from the OAuth session / CLI login) or a private API key (`sk_kitbase_*`,
 * which the backend also accepts as a bearer token). The token is baked into
 * the client at construction; build one per request from the caller's token.
 */
export function createKitbaseClient(token: string, baseUrl = resolveApiBaseUrl()): KitbaseClient {
	return createClient<paths>({
		baseUrl,
		headers: { Authorization: `Bearer ${token}` },
	});
}

// The shape openapi-fetch returns from every GET/POST call.
export interface FetchResult<T> {
	data?: T;
	error?: unknown;
	response: Response;
}

/**
 * Turns a failed openapi-fetch result into a short, Claude-readable message.
 * Prefers the backend's `error.message`, then a permission hint on 403, then
 * a bare status line.
 */
export function formatApiError(result: FetchResult<unknown>): string {
	const status = result.response.status;
	const backendMessage = extractBackendMessage(result.error);
	if (backendMessage) return `Kitbase API error (${status}): ${backendMessage}`;
	if (status === 401) return "Not authenticated — the Kitbase session is missing or expired.";
	if (status === 403) return "Forbidden — your account lacks permission for this project or data.";
	if (status === 404) return "Not found — check the orgSlug, projectId, and any ids you passed.";
	return `Kitbase API error (HTTP ${status}).`;
}

function extractBackendMessage(error: unknown): string | undefined {
	if (error && typeof error === "object") {
		// Kitbase ErrorResponse shape: { error: { message, code } }
		const inner = (error as { error?: unknown }).error;
		if (inner && typeof inner === "object" && "message" in inner) {
			return String((inner as { message?: unknown }).message);
		}
		if ("message" in error) {
			return String((error as { message?: unknown }).message);
		}
	}
	return undefined;
}
