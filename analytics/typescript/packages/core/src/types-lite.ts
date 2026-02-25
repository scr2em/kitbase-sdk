import type { BotDetectionConfig } from './botDetection.js';

/**
 * Configuration options for bot detection
 * @internal This is an internal API and may change without notice.
 */
export type { BotDetectionConfig };

/**
 * Configuration options for privacy and consent management (lite version)
 */
export interface PrivacyConfigLite {
  /**
   * Start with tracking opted out by default.
   * User must explicitly call optIn() to enable tracking.
   * @default false
   */
  optOutByDefault?: boolean;

  /**
   * Storage key for the opt-out state.
   * @default '_ka_opt_out'
   */
  optOutStorageKey?: string;
}

/**
 * Configuration options for the Kitbase lite client (without offline queue)
 */
export interface KitbaseLiteConfig {
  /**
   * Your Kitbase API key
   */
  token: string;

  /**
   * Override the default API endpoint.
   * @default 'https://api.kitbase.dev'
   */
  baseUrl?: string;

  /**
   * Enable debug mode for console logging.
   * @default false
   */
  debug?: boolean;

  /**
   * Analytics tracking configuration.
   * Enables pageview tracking and revenue tracking.
   */
  analytics?: AnalyticsConfig;

  /**
   * Bot detection configuration.
   * When enabled, detects automated traffic and can block tracking for bots.
   * @internal This is an internal API and may change without notice.
   */
  botDetection?: BotDetectionConfig;

  /**
   * Privacy and consent management configuration.
   * Allows users to opt out of tracking for GDPR/CCPA compliance.
   */
  privacy?: PrivacyConfigLite;
}

/**
 * Tag values can be strings, numbers, or booleans
 */
export type TagValue = string | number | boolean;

/**
 * Event tags for additional metadata
 */
export type Tags = Record<string, TagValue>;

/**
 * Options for tracking an event
 */
export interface TrackOptions {
  /**
   * The channel/category for the event
   * @example 'payments', 'auth', 'users'
   */
  channel: string;

  /**
   * The name of the event
   * @example 'New Subscription', 'User Signed Up'
   */
  event: string;

  /**
   * Optional user identifier (set when user is identified/logged in)
   */
  user_id?: string;

  /**
   * Icon for the event (emoji or icon name)
   * @example '💰', 'money_bag'
   */
  icon?: string;

  /**
   * Whether to send a notification for this event
   * @default false
   */
  notify?: boolean;

  /**
   * Optional description for the event
   */
  description?: string;

  /**
   * Additional metadata tags
   */
  tags?: Tags;

}

/**
 * Response from the track API
 */
export interface TrackResponse {
  /**
   * Unique identifier for the logged event
   */
  id: string;

  /**
   * The event name
   */
  event: string;

  /**
   * Server timestamp when the event was recorded
   */
  timestamp: string;
}

/**
 * Internal request payload sent to the API
 */
export interface LogPayload {
  channel: string;
  event: string;
  user_id?: string;
  icon?: string;
  notify?: boolean;
  description?: string;
  tags?: Tags;
  /**
   * Client-side timestamp (ms since epoch) when the event occurred.
   * Added by the offline queue for accurate timing of queued events.
   */
  client_timestamp?: number;
}

// ============================================================
// Analytics Types
// ============================================================

/**
 * Configuration for analytics tracking
 */
export interface AnalyticsConfig {
  /**
   * Enable automatic pageview tracking on route changes
   * @default true
   */
  autoTrackPageViews?: boolean;

  /**
   * Enable automatic outbound link click tracking
   * Tracks when users click links to external domains
   * @default true
   */
  autoTrackOutboundLinks?: boolean;

  /**
   * Track clicks on interactive elements (buttons, links, inputs)
   * @default true
   */
  autoTrackClicks?: boolean;

  /**
   * Track max scroll depth per page (sent on navigation)
   * @default true
   */
  autoTrackScrollDepth?: boolean;

  /**
   * Track visibility duration of elements with `data-kb-track-visibility` attribute.
   * Uses IntersectionObserver to measure how long elements are visible in the viewport.
   * @default true
   */
  autoTrackVisibility?: boolean;

  /**
   * Track Core Web Vitals (LCP, CLS, INP, FCP, TTFB).
   * Collects all metrics and sends them as a single `web_vitals` event.
   * Requires the `web-vitals` library (included as a dependency).
   * @default false
   */
  autoTrackWebVitals?: boolean;

  /**
   * Detect frustration signals (rage clicks and dead clicks).
   * Rage clicks: 3+ rapid clicks in the same area within 1 second.
   * Dead clicks: clicks on interactive elements that produce no DOM change.
   * @default true
   */
  autoDetectFrustration?: boolean;
}

/**
 * Options for tracking a pageview
 */
export interface PageViewOptions {
  /**
   * The page path (defaults to window.location.pathname)
   */
  path?: string;

  /**
   * The page title (defaults to document.title)
   */
  title?: string;

  /**
   * The referrer URL
   */
  referrer?: string;

  /**
   * Additional metadata tags
   */
  tags?: Tags;
}

/**
 * Options for tracking revenue
 */
export interface RevenueOptions {
  /**
   * Revenue amount in cents (e.g., 1999 for $19.99)
   */
  amount: number;

  /**
   * Currency code (e.g., 'USD', 'EUR')
   * @default 'USD'
   */
  currency?: string;

  /**
   * Optional user identifier
   */
  user_id?: string;

  /**
   * Additional metadata tags
   */
  tags?: Tags;
}

/**
 * Options for identifying a user
 */
export interface IdentifyOptions {
  /**
   * The unique user identifier
   */
  userId: string;

  /**
   * User traits/properties
   */
  traits?: Tags;
}
