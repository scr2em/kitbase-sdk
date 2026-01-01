/**
 * Configuration for the Kitbase Ionic CLI
 */
export interface KitbaseConfig {
  /** API key for authentication (from KITBASE_API_KEY env var) */
  apiKey: string;
  /** Base URL for the API */
  baseUrl?: string;
}

/**
 * Git information collected from the repository
 */
export interface GitInfo {
  /** Git commit hash */
  commitHash: string;
  /** Git branch name */
  branchName: string;
  /** Git commit message (optional) */
  commitMessage?: string;
}

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
  /** Git commit hash */
  commitHash: string;
  /** Git branch name */
  branchName: string;
  /** Git commit message */
  commitMessage?: string;
  /** Native app version */
  nativeVersion: string;
  /** Build file (zipped web assets) */
  file: Buffer;
  /** File name */
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
 * Push command options
 */
export interface PushOptions {
  /** Skip the build step */
  skipBuild: boolean;
  /** Custom output directory */
  outputDir?: string;
  /** Custom zip file path (when skipBuild is true) */
  file?: string;
  /** Custom native version */
  version?: string;
  /** Custom commit hash */
  commit?: string;
  /** Custom branch name */
  branch?: string;
  /** Custom commit message */
  message?: string;
  /** Verbose output */
  verbose: boolean;
}
