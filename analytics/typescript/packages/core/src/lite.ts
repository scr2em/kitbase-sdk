/**
 * Kitbase Lite SDK - Lightweight version without offline queue support
 *
 * This is a minimal build of the Kitbase SDK that removes the offline
 * queueing functionality (and the ~50KB dexie dependency) for a smaller
 * bundle size (~12KB vs ~50KB).
 *
 * Features included:
 * - Event tracking (track, trackPageView, trackRevenue, trackOutboundLink)
 * - User identification (identify, reset)
 * - Super properties (register, registerOnce, unregister)
 * - Time events (timeEvent, cancelTimeEvent)
 * - Bot detection
 * - Privacy/consent management (optOut, optIn)
 *
 * Features excluded:
 * - Offline queue (events are sent directly to API)
 * - Write-ahead logging (no local persistence)
 *
 * @example Script tag injection
 * ```html
 * <script>
 *   window.KITBASE_CONFIG = {
 *     token: 'your-api-key',
 *     debug: true,
 *     analytics: { autoTrackPageViews: true }
 *   };
 * </script>
 * <script src="https://kitbase.dev/script.js"></script>
 * <script>
 *   window.kitbase.track({ channel: 'web', event: 'Page Loaded' });
 * </script>
 * ```
 *
 * @example NPM import
 * ```typescript
 * import { Kitbase } from '@kitbase/analytics/lite';
 * const kitbase = new Kitbase({ token: 'your-api-key' });
 * ```
 *
 * @packageDocumentation
 */

// Export the KitbaseAnalytics class
export { KitbaseAnalytics } from './client-base.js';

// Lite types (without offline config)
export type {
  KitbaseLiteConfig,
  KitbaseLiteConfig as KitbaseConfig,
  TrackOptions,
  TrackResponse,
  Tags,
  TagValue,
  AnalyticsConfig,
  PageViewOptions,
  RevenueOptions,
  IdentifyOptions,
  PrivacyConfigLite,
  PrivacyConfigLite as PrivacyConfig,
} from './types-lite.js';

// Bot detection utilities
export {
  detectBot,
  isBot,
  isUserAgentBot,
  getUserAgent,
  DEFAULT_BOT_DETECTION_CONFIG,
  type BotDetectionConfig,
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

// Import types for window augmentation
import type { KitbaseLiteConfig } from './types-lite.js';
import { KitbaseAnalytics } from './client-base.js';

// Window type augmentation for auto-initialization
declare global {
  interface Window {
    /**
     * Configuration object for auto-initializing KitbaseAnalytics when the script loads.
     * Set this before loading the Kitbase lite script to automatically create
     * a `window.kitbase` instance.
     */
    KITBASE_CONFIG?: KitbaseLiteConfig;

    /**
     * The auto-initialized KitbaseAnalytics instance (if KITBASE_CONFIG was set)
     * or manually assigned instance.
     */
    kitbase?: KitbaseAnalytics;
  }
}

// Auto-initialize when script loads if KITBASE_CONFIG is set
if (typeof window !== 'undefined' && window.KITBASE_CONFIG) {
  try {
    window.kitbase = new KitbaseAnalytics(window.KITBASE_CONFIG);

    // Log initialization in debug mode
    if (window.KITBASE_CONFIG.debug) {
      console.log('[Kitbase] Auto-initialized from window.KITBASE_CONFIG');
    }
  } catch (error) {
    console.error('[Kitbase] Failed to auto-initialize:', error);
  }
}
