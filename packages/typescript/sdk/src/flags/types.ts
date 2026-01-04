import type { FlagConfiguration } from './config-types.js';

/**
 * Configuration options for the FlagsClient
 */
export interface FlagsConfig {
  /**
   * Your Kitbase API key
   */
  token: string;

  /**
   * Enable local evaluation mode.
   * When true, the SDK fetches flag configuration once and evaluates flags locally.
   * When false (default), each flag evaluation makes an API call.
   * @default false
   */
  enableLocalEvaluation?: boolean;

  /**
   * How often to refresh the environment configuration in seconds (local evaluation only).
   * Set to 0 to disable automatic refresh.
   * @default 60
   */
  environmentRefreshIntervalSeconds?: number;

  /**
   * Enable real-time updates via SSE streaming (local evaluation only).
   * When true, uses Server-Sent Events instead of polling.
   * @default false
   */
  enableRealtimeUpdates?: boolean;

  /**
   * Initial configuration to use before fetching from server (local evaluation only).
   * Useful for SSR or offline-first scenarios.
   */
  initialConfiguration?: FlagConfiguration;

  /**
   * Callback when configuration is updated (local evaluation only).
   */
  onConfigurationChange?: (config: FlagConfiguration) => void;

  /**
   * Callback when an error occurs during config fetch/stream (local evaluation only).
   */
  onError?: (error: Error) => void;
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
