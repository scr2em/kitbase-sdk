import { CREDENTIALS_FILE } from "./paths.js";
import { readJsonFile, writeJsonFileAtomic } from "./fs-utils.js";

// Same shape the Kitbase CLI writes, keyed by base URL, so stdio mode can
// reuse a `kitbase login` session directly.
export interface StoredCredentials {
	accessToken: string;
	refreshToken: string;
	/** ISO 8601 timestamp — access token expiry. */
	expiresAt: string;
	/** ISO 8601 timestamp — refresh token expiry, informational only. */
	refreshTokenExpiresAt?: string;
	userEmail?: string;
}

type CredentialsFile = Record<string, StoredCredentials>;

function readAll(): CredentialsFile {
	return readJsonFile<CredentialsFile>(CREDENTIALS_FILE, {});
}

function writeAll(data: CredentialsFile): void {
	writeJsonFileAtomic(CREDENTIALS_FILE, data, 0o600);
}

export function getCredentials(baseUrl: string): StoredCredentials | undefined {
	return readAll()[baseUrl];
}

export function setCredentials(baseUrl: string, credentials: StoredCredentials): void {
	const all = readAll();
	all[baseUrl] = credentials;
	writeAll(all);
}

export function clearCredentials(baseUrl: string): void {
	const all = readAll();
	delete all[baseUrl];
	writeAll(all);
}
