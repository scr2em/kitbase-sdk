// Raw call to the Kitbase backend's token refresh endpoint, used by the
// stdio local-token resolver. No typed client here — this is a pre-auth
// endpoint hit with plain fetch, mirroring the Kitbase CLI (cli/src/lib/auth.ts).

import type { components } from "../generated/api.js";

export type AuthResponse = components["schemas"]["AuthResponse"];

/** POST /auth/refresh-token — exchange a refresh token for a fresh access token. */
export async function refreshAuthToken(baseUrl: string, refreshToken: string): Promise<AuthResponse> {
	const response = await fetch(`${baseUrl}/auth/refresh-token`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify({ refreshToken }),
	});
	if (!response.ok) {
		throw new Error(`Token refresh failed (HTTP ${response.status})`);
	}
	return response.json() as Promise<AuthResponse>;
}
