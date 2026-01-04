/**
 * Types for feature flag configuration used in local evaluation
 */

import type { FlagValueType } from './types.js';

/**
 * Supported operators for segment rule conditions
 */
export type SegmentOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'exists'
  | 'not_exists'
  | 'in'
  | 'not_in';

/**
 * A single rule condition within a segment
 */
export interface SegmentRuleDefinition {
  /**
   * The context attribute field to match against
   */
  field: string;

  /**
   * Comparison operator
   */
  operator: SegmentOperator;

  /**
   * The value to compare against (interpretation depends on operator)
   */
  value?: string | null;
}

/**
 * A targeting segment definition for client-side evaluation
 */
export interface SegmentDefinition {
  /**
   * Unique segment key for rule matching
   */
  key: string;

  /**
   * Human-readable segment name
   */
  name?: string;

  /**
   * List of rules that define this segment (AND logic)
   */
  rules: SegmentRuleDefinition[];
}

/**
 * A targeting rule for client-side evaluation
 */
export interface FlagRuleDefinition {
  /**
   * Rule priority (lower = higher priority, 0 is first)
   */
  priority: number;

  /**
   * Segment key to match (null for rules without segment targeting)
   */
  segmentKey?: string | null;

  /**
   * Percentage rollout (0-100). Requires targetingKey for evaluation.
   */
  rolloutPercentage?: number | null;

  /**
   * Whether to enable the flag when this rule matches
   */
  enabled: boolean;

  /**
   * Value to return when this rule matches (type depends on flag valueType)
   */
  value?: unknown;
}

/**
 * A feature flag definition for client-side evaluation
 */
export interface FlagDefinition {
  /**
   * Unique flag key for evaluation
   */
  key: string;

  /**
   * The data type of the feature flag value
   */
  valueType: FlagValueType;

  /**
   * Default enabled state when no rules match
   */
  defaultEnabled: boolean;

  /**
   * Default value when flag is enabled (type depends on valueType)
   */
  defaultValue?: unknown;

  /**
   * Ordered list of targeting rules (evaluated in priority order)
   */
  rules?: FlagRuleDefinition[];
}

/**
 * Complete feature flag configuration for client-side local evaluation
 */
export interface FlagConfiguration {
  /**
   * Environment ID this configuration belongs to
   */
  environmentId: string;

  /**
   * Schema version for SDK compatibility (e.g., "1.0")
   */
  schemaVersion: string;

  /**
   * Timestamp when this configuration was generated
   */
  generatedAt: string;

  /**
   * ETag for cache validation
   */
  etag?: string;

  /**
   * List of flag definitions with embedded rules
   */
  flags: FlagDefinition[];

  /**
   * List of segment definitions with embedded rules
   */
  segments: SegmentDefinition[];
}

/**
 * Configuration options for the LocalFlagsClient
 */
export interface LocalFlagsConfig {
  /**
   * Your Kitbase API key
   */
  token: string;

  /**
   * Whether to enable streaming updates via SSE
   * @default false
   */
  streaming?: boolean;

  /**
   * Polling interval in milliseconds (when streaming is disabled)
   * Set to 0 to disable polling
   * @default 60000 (1 minute)
   */
  pollingInterval?: number;

  /**
   * Initial configuration to use before fetching from server
   * Useful for SSR or offline-first scenarios
   */
  initialConfig?: FlagConfiguration;

  /**
   * Callback when configuration is updated
   */
  onConfigurationChange?: (config: FlagConfiguration) => void;

  /**
   * Callback when an error occurs during config fetch/stream
   */
  onError?: (error: Error) => void;
}

