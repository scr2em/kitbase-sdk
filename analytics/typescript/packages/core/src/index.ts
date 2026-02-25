// Main client
export { KitbaseAnalytics, init, getInstance } from './client.js';

// Types
export type {
  KitbaseConfig,
  TrackOptions,
  TrackResponse,
  Tags,
  TagValue,
  OfflineConfig,
  // Analytics types
  AnalyticsConfig,
  PageViewOptions,
  RevenueOptions,
  IdentifyOptions,
  // Bot detection types (@internal)
  BotDetectionConfig,
} from './types.js';

// Queue types
export type { QueuedEvent, QueueStats } from './queue/types.js';

// Bot detection utilities (@internal — may change without notice)
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

// Plugin system
export type { KitbasePlugin, PluginContext } from './plugins/types.js';
export {
  createDefaultPlugins,
  PageViewPlugin,
  OutboundLinksPlugin,
  ClickTrackingPlugin,
  ScrollDepthPlugin,
  VisibilityPlugin,
  WebVitalsPlugin,
  FrustrationPlugin,
} from './plugins/index.js';
