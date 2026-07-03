// Token resolution for stdio mode. There's no OAuth session locally, so we
// resolve a bearer token in this order:
//   1. KITBASE_TOKEN     — an explicit JWT (power users / CI)
//   2. KITBASE_API_KEY   — a private API key (sk_kitbase_*), sent as-is, never refreshed
//   3. CLI credentials   — ~/.config/kitbase/credentials.json from `kitbase login`,
//                          refreshed proactively when near expiry (written back 0600)
// Resolution runs lazily on the first tool call (not at startup) so `initialize`
// still succeeds for inspection even when the user hasn't logged in.

import { resolveApiBaseUrl } from "../config.js";
import { getCredentials, setCredentials, type StoredCredentials } from "../lib/credentials.js";
import { refreshAuthToken } from "./kitbase-auth.js";

// Refresh proactively once the access token is within this many seconds of expiring.
const REFRESH_SKEW_SECONDS = 60;
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // Mirrors the backend JWT TTL (~1h).

let refreshInFlight: Promise<string> | undefined;

export class LocalAuthError extends Error {}

/**
 * Returns a bearer token for stdio mode, or throws LocalAuthError with guidance
 * if no credentials are available.
 */
export async function resolveLocalToken(): Promise<string> {
	const explicit = process.env.KITBASE_TOKEN;
	if (explicit && explicit.length > 0) return explicit;

	const apiKey = process.env.KITBASE_API_KEY;
	if (apiKey && apiKey.length > 0) return apiKey;

	const baseUrl = resolveApiBaseUrl();
	const credentials = getCredentials(baseUrl);
	if (!credentials) {
		throw new LocalAuthError(
			"Not authenticated. Run `kitbase login`, or set KITBASE_TOKEN / KITBASE_API_KEY.",
		);
	}

	const expiresAt = new Date(credentials.expiresAt).getTime();
	const needsRefresh = Number.isNaN(expiresAt) || expiresAt - Date.now() < REFRESH_SKEW_SECONDS * 1000;
	if (!needsRefresh) return credentials.accessToken;

	return refreshLocalToken(baseUrl, credentials);
}

function refreshLocalToken(baseUrl: string, credentials: StoredCredentials): Promise<string> {
	// Collapse concurrent refreshes within this process to a single call.
	refreshInFlight ??= (async () => {
		try {
			const auth = await refreshAuthToken(baseUrl, credentials.refreshToken);
			const accessToken = auth.accessToken as string;
			setCredentials(baseUrl, {
				...credentials,
				accessToken,
				refreshToken: (auth.refreshToken as string) ?? credentials.refreshToken,
				expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString(),
			});
			return accessToken;
		} finally {
			refreshInFlight = undefined;
		}
	})();
	return refreshInFlight;
}
