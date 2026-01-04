/**
 * Configuration options for the Kitbase client
 */
export interface KitbaseConfig {
  /**
   * Your Kitbase API key
   */
  token: string;
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
   * Optional user identifier
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
}







