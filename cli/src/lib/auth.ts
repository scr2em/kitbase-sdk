import type { components } from "../generated/api.js";
import { AuthenticationError } from "./errors.js";
import { clearCredentials, getCredentials, setCredentials, type StoredCredentials } from "./credentials.js";

type CliAuthSessionCreateResponse = components["schemas"]["CliAuthSessionCreateResponse"];
type CliAuthTokenResponse = components["schemas"]["CliAuthTokenResponse"];
type CliAuthTokenPendingResponse = components["schemas"]["CliAuthTokenPendingResponse"];
type AuthResponse = components["schemas"]["AuthResponse"];

// Refresh proactively once the access token is within this many seconds of expiring.
const REFRESH_SKEW_SECONDS = 60;

// One in-flight refresh per base URL, so concurrent requests within the same process don't
// each race to refresh (the server-side refresh token isn't rotated, so racing wouldn't
// corrupt anything, but it would still mean redundant network calls).
const refreshInFlight = new Map<string, Promise<StoredCredentials>>();

export interface CreateLoginSessionParams {
	deviceName: string;
	clientVersion: string;
	loopbackPort?: number;
	state?: string;
}

export async function createLoginSession(
	baseUrl: string,
	params: CreateLoginSessionParams,
): Promise<CliAuthSessionCreateResponse> {
	const response = await fetch(`${baseUrl}/auth/cli/sessions`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
	});
	if (!response.ok) {
		throw new AuthenticationError(await extractErrorMessage(response), `${baseUrl}/auth/cli/sessions`);
	}
	return response.json() as Promise<CliAuthSessionCreateResponse>;
}

export type PollResult =
	| { status: "pending"; pollIntervalSeconds: number }
	| { status: "denied" }
	| { status: "expired" }
	| { status: "authenticated"; tokens: CliAuthTokenResponse };

export async function pollLoginSession(baseUrl: string, sessionId: string, pollSecret: string): Promise<PollResult> {
	const response = await fetch(`${baseUrl}/auth/cli/sessions/${sessionId}/token`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ pollSecret }),
	});

	if (response.status === 202) {
		const pending = (await response.json()) as CliAuthTokenPendingResponse;
		return { status: "pending", pollIntervalSeconds: pending.pollIntervalSeconds };
	}
	if (response.status === 403) {
		return { status: "denied" };
	}
	if (response.status === 410 || response.status === 404) {
		return { status: "expired" };
	}
	if (!response.ok) {
		throw new AuthenticationError(await extractErrorMessage(response), `${baseUrl}/auth/cli/sessions/${sessionId}/token`);
	}

	const tokens = (await response.json()) as CliAuthTokenResponse;
	return { status: "authenticated", tokens };
}

export function storeLoginTokens(baseUrl: string, tokens: CliAuthTokenResponse): void {
	setCredentials(baseUrl, {
		accessToken: tokens.accessToken,
		refreshToken: tokens.refreshToken,
		expiresAt: accessTokenExpiryFromNow(),
		refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
		userEmail: tokens.user?.email,
	});
}

/** Mirrors the JWT access-token TTL (1h) so we know roughly when to refresh, without decoding the JWT. */
function accessTokenExpiryFromNow(): string {
	return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

export async function logout(baseUrl: string): Promise<void> {
	const credentials = getCredentials(baseUrl);
	if (credentials) {
		try {
			await fetch(`${baseUrl}/auth/logout`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refreshToken: credentials.refreshToken }),
			});
		} catch {
			// Best-effort — the local credential wipe below is what actually matters to the user.
		}
	}
	clearCredentials(baseUrl);
}

/**
 * Returns a valid access token for `baseUrl`, refreshing it first if it's missing or about to
 * expire. Returns `undefined` if there's no stored session at all (caller should prompt login).
 */
export async function getValidAccessToken(baseUrl: string): Promise<string | undefined> {
	const credentials = getCredentials(baseUrl);
	if (!credentials) {
		return undefined;
	}

	const expiresAt = new Date(credentials.expiresAt).getTime();
	const needsRefresh = Number.isNaN(expiresAt) || expiresAt - Date.now() < REFRESH_SKEW_SECONDS * 1000;
	if (!needsRefresh) {
		return credentials.accessToken;
	}

	const refreshed = await refreshAccessToken(baseUrl, credentials);
	return refreshed.accessToken;
}

/**
 * Forces a refresh regardless of the locally cached expiry — used when the server rejects a
 * token we believed was still valid (clock skew, server-side revocation, etc). Returns
 * `undefined` if there's no stored session to refresh.
 */
export async function forceRefreshAccessToken(baseUrl: string): Promise<string | undefined> {
	const credentials = getCredentials(baseUrl);
	if (!credentials) {
		return undefined;
	}
	const refreshed = await refreshAccessToken(baseUrl, credentials);
	return refreshed.accessToken;
}

async function refreshAccessToken(baseUrl: string, credentials: StoredCredentials): Promise<StoredCredentials> {
	const inFlight = refreshInFlight.get(baseUrl);
	if (inFlight) {
		return inFlight;
	}

	const promise = (async (): Promise<StoredCredentials> => {
		const response = await fetch(`${baseUrl}/auth/refresh-token`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refreshToken: credentials.refreshToken }),
		});

		if (!response.ok) {
			clearCredentials(baseUrl);
			throw new AuthenticationError("Your session has expired.", `${baseUrl}/auth/refresh-token`);
		}

		const auth = (await response.json()) as AuthResponse;
		const updated: StoredCredentials = {
			...credentials,
			accessToken: auth.accessToken as string,
			refreshToken: (auth.refreshToken as string) ?? credentials.refreshToken,
			expiresAt: accessTokenExpiryFromNow(),
		};
		setCredentials(baseUrl, updated);
		return updated;
	})();

	refreshInFlight.set(baseUrl, promise);
	try {
		return await promise;
	} finally {
		refreshInFlight.delete(baseUrl);
	}
}

async function extractErrorMessage(response: Response): Promise<string> {
	try {
		const body = (await response.json()) as { error?: { message?: string } };
		return body.error?.message ?? `Request failed with status ${response.status}`;
	} catch {
		return `Request failed with status ${response.status}`;
	}
}
