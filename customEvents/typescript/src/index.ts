// Main client
export { Kitbase } from './client.js';

// Types
export type {
  KitbaseConfig,
  TrackOptions,
  TrackResponse,
  Tags,
  TagValue,
  Storage,
  OfflineConfig,
  // Analytics types
  Session,
  AnalyticsConfig,
  PageViewOptions,
  RevenueOptions,
  IdentifyOptions,
} from './types.js';

// Queue types
export type { QueuedEvent, QueueStats } from './queue/types.js';

// Errors
export {
  KitbaseError,
  ApiError,
  AuthenticationError,
  ValidationError,
  TimeoutError,
} from './errors.js';
