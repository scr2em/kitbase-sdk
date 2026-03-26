/**
 * Configuration for the Kitbase CLI
 */
export interface KitbaseConfig {
	/** SDK key for authentication */
	apiKey: string;
	/** Base URL for the API */
	baseUrl?: string;
}

/**
 * Git information collected from the repository
 */
export interface GitInfo {
	commitHash: string;
	branchName: string;
	commitMessage?: string;
}