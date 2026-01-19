import type { FlagConfiguration } from './config-types.js';

/**
 * Remote evaluation cache configuration options
 */
export interface RemoteEvaluationCacheConfig {
  /**
   * Time-to-live in milliseconds for cached flag values.
   * Set to 0 to disable TTL (cache never expires).
   * @default 60000 (1 minute)
   */
  ttl?: number;

  /**
   * Enable persistent cache using localStorage.
   * When enabled, cached flags are restored on page reload to prevent flashing.
   * Only works in browser environments.
   * @default true in browser, false otherwise
   */
  persistent?: boolean;
}

/**
 * Local evaluation configuration options
 */
export interface LocalEvaluationConfig {
  /**
   * Enable local evaluation mode.
   * When true, the SDK fetches flag configuration once and evaluates flags locally.
   * @default false
   */
  enabled?: boolean;

  /**
   * How often to refresh the environment configuration in seconds.
   * Set to 0 to disable automatic refresh.
   * @default 60
   */
  refreshIntervalSeconds?: number;

  /**
   * Initial configuration to use before fetching from server.
   * Useful for SSR or offline-first scenarios.
   */
  initialConfiguration?: FlagConfiguration;
}

/**
 * Configuration options for the FlagsClient
 */
export interface FlagsConfig {
  /**
   * Your Kitbase SDK key (required)
   */
  sdkKey: string;

  /**
   * Base URL for the Kitbase API.
   * Use this if you are self-hosting the Kitbase API.
   * @default https://api.kitbase.dev
   */
  baseUrl?: string;

  /**
   * Local evaluation settings.
   * When enabled, the SDK fetches flag configuration once and evaluates flags locally
   * instead of making an API call for each evaluation.
   */
  localEvaluation?: LocalEvaluationConfig;

  /**
   * Cache settings for remote evaluation mode.
   */
  remoteEvaluationCache?: RemoteEvaluationCacheConfig;

  /**
   * Callback when configuration is updated (local evaluation only).
   */
  onConfigurationChange?: (config: FlagConfiguration) => void;

  /**
   * Callback when an error occurs during config fetch/stream (local evaluation only).
   */
  onError?: (error: Error) => void;

  /**
   * Global default values for flags.
   * Used as fallback when:
   * - Flag is disabled from backend
   * - Backend returns an error
   * - Flag is not found
   *
   * @example
   * ```typescript
   * const client = new FlagsClient({
   *   sdkKey: 'YOUR_SDK_KEY',
   *   defaultValues: {
   *     'dark-mode': false,
   *     'api-url': 'https://api.default.com',
   *     'max-items': 10,
   *   }
   * });
   * ```
   */
  defaultValues?: Record<string, unknown>;
}

/**
 * Flag value types supported by Kitbase
 */
export type FlagValueType = 'boolean' | 'number' | 'string' | 'json';

/**
 * OpenFeature-compatible resolution reasons
 *
 * @see https://openfeature.dev/specification/types#resolution-details
 */
export type ResolutionReason =
  | 'STATIC'
  | 'DEFAULT'
  | 'TARGETING_MATCH'
  | 'SPLIT'
  | 'CACHED'
  | 'DISABLED'
  | 'UNKNOWN'
  | 'STALE'
  | 'ERROR';

/**
 * OpenFeature-compatible error codes
 *
 * @see https://openfeature.dev/specification/types#error-code
 */
export type ErrorCode =
  | 'PROVIDER_NOT_READY'
  | 'FLAG_NOT_FOUND'
  | 'PARSE_ERROR'
  | 'TYPE_MISMATCH'
  | 'TARGETING_KEY_MISSING'
  | 'INVALID_CONTEXT'
  | 'GENERAL';

/**
 * Evaluation context for targeting and percentage rollouts
 * Compatible with OpenFeature EvaluationContext
 *
 * @see https://openfeature.dev/specification/types#evaluation-context
 */
export interface EvaluationContext {
  /**
   * Unique identifier for the user/device (used for percentage rollouts)
   * Maps to OpenFeature's targetingKey
   */
  targetingKey?: string;

  /**
   * Additional context attributes for targeting rules
   */
  [key: string]: unknown;
}

/**
 * OpenFeature-compatible resolution details
 *
 * @see https://openfeature.dev/specification/types#resolution-details
 */
export interface ResolutionDetails<T> {
  /**
   * The resolved flag value
   */
  value: T;

  /**
   * OpenFeature variant identifier (e.g., "control", "treatment-a")
   */
  variant?: string;

  /**
   * Reason for the resolved value
   */
  reason: ResolutionReason;

  /**
   * Error code if evaluation failed
   */
  errorCode?: ErrorCode;

  /**
   * Human-readable error message
   */
  errorMessage?: string;

  /**
   * Optional metadata about the flag
   */
  flagMetadata?: Record<string, unknown>;
}

/**
 * A single evaluated feature flag from the API
 */
export interface EvaluatedFlag {
  /**
   * Unique key for the flag
   */
  flagKey: string;

  /**
   * Whether the flag is enabled for this identity
   */
  enabled: boolean;

  /**
   * The type of value this flag returns
   */
  valueType: FlagValueType;

  /**
   * The evaluated value (type depends on valueType, null if disabled)
   */
  value: unknown;

  /**
   * OpenFeature variant identifier
   */
  variant?: string;

  /**
   * Reason for the resolved value
   */
  reason: ResolutionReason;

  /**
   * Error code if evaluation failed
   */
  errorCode?: ErrorCode;

  /**
   * Human-readable error message
   */
  errorMessage?: string;

  /**
   * Optional metadata about the flag
   */
  flagMetadata?: Record<string, unknown>;
}

/**
 * Response from the snapshot API containing all evaluated flags
 */
export interface FlagSnapshot {
  /**
   * Project ID the flags belong to
   */
  projectId: string;

  /**
   * Environment ID the flags were evaluated for
   */
  environmentId: string;

  /**
   * Timestamp when the evaluation was performed
   */
  evaluatedAt: string;

  /**
   * List of evaluated feature flags
   */
  flags: EvaluatedFlag[];
}

/**
 * Options for evaluating flags
 */
export interface EvaluateOptions {
  /**
   * Evaluation context for targeting
   */
  context?: EvaluationContext;
}

/**
 * Options for evaluating a single flag
 */
export interface EvaluateFlagOptions extends EvaluateOptions {
  /**
   * Default value to return if flag cannot be evaluated
   */
  defaultValue?: unknown;
}

/**
 * Internal request payload for snapshot endpoint
 */
export interface SnapshotPayload {
  identityId?: string;
  context?: Record<string, unknown>;
}

/**
 * Internal request payload for evaluate endpoint
 */
export interface EvaluateFlagPayload {
  flagKey: string;
  identityId?: string;
  context?: Record<string, unknown>;
  defaultValue?: unknown;
}

/**
 * JSON value type for complex flag values
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Map of flag keys to their new values when flags change
 */
export type ChangedFlags = Record<string, unknown>;

/**
 * Callback for flag change events
 */
export type FlagChangeCallback = (changedFlags: ChangedFlags) => void;

/**
 * Subscription handle for flag change listeners
 */
export interface FlagChangeSubscription {
  /**
   * Unsubscribe from flag change events
   */
  unsubscribe: () => void;
}
