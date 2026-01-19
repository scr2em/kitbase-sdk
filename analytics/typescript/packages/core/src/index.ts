// Main client
export { KitbaseAnalytics } from './client.js';

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
  // Bot detection types
  BotDetectionConfig,
  // Privacy types
  PrivacyConfig,
} from './types.js';

// Queue types
export type { QueuedEvent, QueueStats } from './queue/types.js';

// Bot detection utilities
export {
  detectBot,
  isBot,
  isUserAgentBot,
  getUserAgent,
  type BotDetectionResult,
} from './botDetection.js';

// Errors
export {
  KitbaseError,
  ApiError,
  AuthenticationError,
  ValidationError,
  TimeoutError,
} from './errors.js';
