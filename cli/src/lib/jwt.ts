export interface DecodedAccessToken {
	sub?: string;
	email?: string;
	exp?: number;
	iat?: number;
	impersonatedBy?: string;
}

/**
 * Decodes a JWT's payload for display purposes only — no signature verification. The server is
 * always the source of truth for authorization; this just lets the CLI show "who am I" without
 * an extra network round trip.
 */
export function decodeAccessToken(token: string): DecodedAccessToken | null {
	try {
		const payload = token.split(".")[1];
		if (!payload) return null;
		return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as DecodedAccessToken;
	} catch {
		return null;
	}
}
