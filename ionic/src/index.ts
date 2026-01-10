/**
 * Kitbase Ionic SDK
 *
 * Build and upload your Ionic web apps to Kitbase for OTA updates.
 *
 * @example CLI usage
 * ```bash
 * # Build and upload
 * npx @kitbase/ionic push
 *
 * # Upload existing build (skip build step)
 * npx @kitbase/ionic push --skip-build
 *
 * # Upload existing zip file
 * npx @kitbase/ionic push --file ./build.zip
 * ```
 *
 * @example Programmatic usage
 * ```typescript
 * import { UploadClient, getGitInfo, getNativeVersion, buildAndZip } from '@kitbase/ionic';
 *
 * const client = new UploadClient({ apiKey: process.env.KITBASE_API_KEY });
 * const gitInfo = getGitInfo();
 * const version = getNativeVersion();
 * const zipPath = await buildAndZip({ skipBuild: false });
 *
 * const payload = createUploadPayload(zipPath, gitInfo, version);
 * await client.upload(payload);
 * ```
 *
 * @packageDocumentation
 */

// Types
export type {
  KitbaseConfig,
  GitInfo,
  BuildOptions,
  UploadPayload,
  UploadResponse,
  PushOptions,
} from './types.js';

// Errors
export {
  KitbaseError,
  AuthenticationError,
  ApiError,
  ValidationError,
  BuildError,
  GitError,
  ConfigurationError,
} from './errors.js';

// Git utilities
export {
  getGitInfo,
  getCommitHash,
  getBranchName,
  getCommitMessage,
  isGitRepository,
} from './git.js';

// Build utilities
export {
  buildAndZip,
  buildIonicWeb,
  findWebOutputDir,
  zipDirectory,
  getNativeVersion,
  validateZipFile,
  cleanupTemp,
  isIonicInstalled,
  isIonicProject,
} from './build.js';
export type { BuildAndZipResult } from './build.js';

// Upload client
export { UploadClient, createUploadPayload } from './upload.js';
export type { ProgressCallback, UploadProgress, UploadOptions } from './upload.js';

// Config utilities
export {
  getApiKey,
  readApiKeyFromConfig,
  writeApiKeyToConfig,
  configExists,
  getConfigPath,
} from './config.js';
