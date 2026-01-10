// Main client
export { Changelogs } from './client.js';

// Types
export type { ChangelogsConfig, ChangelogResponse } from './types.js';

// Errors
export {
  ChangelogsError,
  ApiError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  TimeoutError,
} from './errors.js';
