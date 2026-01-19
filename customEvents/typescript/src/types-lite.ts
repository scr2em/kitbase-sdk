import type { BotDetectionConfig } from './botDetection.js';

/**
 * Storage interface for anonymous ID persistence
 */
export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Configuration options for bot detection
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
   * @default 'kitbase_opt_out'
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
   * Custom storage for anonymous ID persistence.
   * Defaults to localStorage in browser, in-memory storage otherwise.
   * Set to null to disable anonymous ID persistence (will generate new ID each session).
   */
  storage?: Storage | null;

  /**
   * Storage key for the anonymous ID.
   * @default 'kitbase_anonymous_id'
   */
  storageKey?: string;

  /**
   * Enable debug mode for console logging.
   * @default false
   */
  debug?: boolean;

  /**
   * Analytics tracking configuration.
   * Enables session tracking, pageview tracking, and revenue tracking.
   */
  analytics?: AnalyticsConfig;

  /**
   * Bot detection configuration.
   * When enabled, detects automated traffic and can block tracking for bots.
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

  /**
   * Whether to include the anonymous ID in this event.
   * @default true
   */
  includeAnonymousId?: boolean;
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
  anonymous_id?: string;
  icon?: string;
  notify?: boolean;
  description?: string;
  tags?: Tags;
  /**
   * Client-side timestamp (ms since epoch) when the event occurred.
   * Used for accurate session duration calculation, especially in offline mode.
   */
  timestamp?: number;
}

// ============================================================
// Analytics Types
// ============================================================

/**
 * Session data for analytics tracking
 */
export interface Session {
  id: string;
  startedAt: number;
  lastActivityAt: number;
  screenViewCount: number;
  entryPath?: string;
  entryReferrer?: string;
}

/**
 * Configuration for analytics tracking
 */
export interface AnalyticsConfig {
  /**
   * Enable automatic pageview tracking on route changes
   * @default false
   */
  autoTrackPageViews?: boolean;

  /**
   * Enable automatic session tracking
   * @default true
   */
  autoTrackSessions?: boolean;

  /**
   * Enable automatic outbound link click tracking
   * Tracks when users click links to external domains
   * @default true
   */
  autoTrackOutboundLinks?: boolean;

  /**
   * Session timeout in milliseconds (default: 30 minutes)
   * @default 1800000
   */
  sessionTimeout?: number;

  /**
   * Storage key for session data
   * @default 'kitbase_session'
   */
  sessionStorageKey?: string;
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
