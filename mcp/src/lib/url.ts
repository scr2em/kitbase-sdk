/** Strips trailing slashes so a base URL is safe to concatenate paths onto. */
export function normalizeBaseUrl(url: string): string {
	return url.replace(/\/+$/, "");
}
