/**
 * Configuration for the Messaging SDK
 *
 * @example CDN / Script tag
 * ```html
 * <script>
 *   window.KITBASE_MESSAGING = { sdkKey: 'your-api-key' };
 * </script>
 * <script src="https://cdn.kitbase.dev/messaging.js"></script>
 * ```
 *
 * @example NPM
 * ```typescript
 * import { Messaging } from '@kitbase/messaging';
 *
 * const messaging = new Messaging({
 *   sdkKey: 'your-api-key',
 *   metadata: { plan: 'pro' },
 * });
 * ```
 */
export interface MessagingConfig {
  /** Your Kitbase SDK key */
  sdkKey: string;

  /**
   * Override the API base URL (for self-hosted instances).
   * @default 'https://api.kitbase.dev'
   */
  baseUrl?: string;

  /**
   * Current user ID. When provided, show-once messages that the user
   * has already viewed are excluded from results.
   *
   * @example
   * ```typescript
   * new Messaging({
   *   sdkKey: '...',
   *   userId: currentUser.id,
   * });
   * ```
   */
  userId?: string;

  /**
   * Metadata key-value pairs for targeting evaluation.
   * Only messages whose targeting conditions match this metadata
   * will be returned.
   *
   * @example
   * ```typescript
   * new Messaging({
   *   sdkKey: '...',
   *   metadata: { plan: 'free', country: 'US' },
   * });
   * ```
   */
  metadata?: Record<string, string>;

  /**
   * How often to poll for new messages (milliseconds).
   * Set to `0` to disable polling (fetch once on init only).
   * @default 60000
   */
  pollInterval?: number;

  /**
   * Automatically render messages in the page.
   * Set to `false` to use data-only mode (fetch without rendering).
   * @default true
   */
  autoShow?: boolean;

  /** Called when a message is displayed to the user. */
  onShow?: (message: InAppMessage) => void;

  /** Called when a message is dismissed (close button or after action). */
  onDismiss?: (message: InAppMessage) => void;

  /**
   * Called when an action button is clicked.
   * By default, the URL is opened in a new tab.
   * Return `false` to prevent the default navigation.
   */
  onAction?: (message: InAppMessage, button: MessageButton) => void | false;
}

// ============================================================
// Message Types
// ============================================================

/** Message display format */
export type MessageType = 'modal' | 'banner' | 'card' | 'image';

/**
 * A message action button with optional styling
 */
export interface MessageButton {
  /** Button label */
  text: string;
  /** URL to navigate to when clicked */
  url: string;
  /** Button background color (hex, e.g. '#4F46E5') */
  color?: string;
  /** Button text color (hex, e.g. '#FFFFFF') */
  textColor?: string;
}

/**
 * An in-app message
 */
export interface InAppMessage {
  /** Unique message ID */
  id: string;
  /** Message heading */
  title: string;
  /** Message body */
  body: string;
  /** If true, the message is hidden after the user views it once */
  showOnce: boolean;
  /** Display format */
  type: MessageType;
  /** Channel this message belongs to, or null */
  channel: string | null;
  /** Optional image URL */
  imageUrl?: string;
  /** Primary action button */
  actionButton?: MessageButton;
  /** Secondary action button (e.g. dismiss) */
  secondaryButton?: MessageButton;
  /** Background color (hex) */
  backgroundColor?: string;
  /** Scheduled start date (ISO-8601) */
  startDate?: string;
  /** Scheduled end date (ISO-8601) */
  endDate?: string;
}

// ============================================================
// Options (for data-only methods)
// ============================================================

/**
 * Options for fetching in-app messages
 */
export interface GetMessagesOptions {
  /** User ID for filtering already-viewed show-once messages */
  userId?: string;
  /** Metadata for targeting evaluation */
  metadata?: Record<string, string>;
}

/**
 * Options for subscribing to messages with polling
 */
export interface SubscribeOptions extends GetMessagesOptions {
  /**
   * How often to poll for new messages (milliseconds).
   * @default 60000
   */
  pollInterval?: number;
}
