/**
 * Build configuration options
 */
export interface BuildOptions {
	/** Skip the build step (use existing build) */
	skipBuild?: boolean;
	/** Custom output directory path */
	outputDir?: string;
}

/**
 * Upload payload for the API
 */
export interface UploadPayload {
	commitHash: string;
	branchName: string;
	commitMessage?: string;
	nativeVersion: string;
	file: Buffer;
	fileName: string;
}

/**
 * Response from the upload API
 */
export interface UploadResponse {
	success: boolean;
	buildId?: string;
	message?: string;
}

/**
 * Response from /api/v1/auth/key-info
 */
export type KeyInfo = import("../generated/cli-api.js").components["schemas"]["KeyInfoResponse"];