/**
 * Local flag evaluation engine
 *
 * Evaluates feature flags locally using the configuration fetched from the server.
 * Supports segment matching, percentage rollouts, and all operator types.
 */

import type {
  FlagConfiguration,
  FlagDefinition,
  FlagRuleDefinition,
  SegmentDefinition,
  SegmentOperator,
} from './config-types.js';
import type {
  EvaluationContext,
  EvaluatedFlag,
  ResolutionReason,
} from './types.js';

/**
 * Result of evaluating a single flag locally
 */
export interface LocalEvaluationResult {
  flag: EvaluatedFlag;
  matchedRule?: FlagRuleDefinition;
  matchedSegment?: string;
}

/**
 * Hash a string to a number between 0 and 99 for percentage rollouts
 * Uses a simple but effective hash function for consistent bucketing
 */
function hashToPercentage(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Convert to positive number and get percentage (0-99)
  return Math.abs(hash) % 100;
}

/**
 * Compare two values for segment rule matching
 */
function compareValues(
  contextValue: unknown,
  ruleValue: string | null | undefined,
  operator: SegmentOperator,
): boolean {
  // Handle exists/not_exists operators first
  if (operator === 'exists') {
    return contextValue !== undefined && contextValue !== null;
  }
  if (operator === 'not_exists') {
    return contextValue === undefined || contextValue === null;
  }

  // For other operators, convert context value to string for comparison
  const contextStr =
    contextValue !== undefined && contextValue !== null
      ? String(contextValue)
      : '';

  const ruleStr = ruleValue ?? '';

  switch (operator) {
    case 'eq':
      return contextStr === ruleStr;

    case 'neq':
      return contextStr !== ruleStr;

    case 'contains':
      return contextStr.includes(ruleStr);

    case 'not_contains':
      return !contextStr.includes(ruleStr);

    case 'starts_with':
      return contextStr.startsWith(ruleStr);

    case 'ends_with':
      return contextStr.endsWith(ruleStr);

    case 'gt': {
      const numContext = parseFloat(contextStr);
      const numRule = parseFloat(ruleStr);
      return !isNaN(numContext) && !isNaN(numRule) && numContext > numRule;
    }

    case 'gte': {
      const numContext = parseFloat(contextStr);
      const numRule = parseFloat(ruleStr);
      return !isNaN(numContext) && !isNaN(numRule) && numContext >= numRule;
    }

    case 'lt': {
      const numContext = parseFloat(contextStr);
      const numRule = parseFloat(ruleStr);
      return !isNaN(numContext) && !isNaN(numRule) && numContext < numRule;
    }

    case 'lte': {
      const numContext = parseFloat(contextStr);
      const numRule = parseFloat(ruleStr);
      return !isNaN(numContext) && !isNaN(numRule) && numContext <= numRule;
    }

    case 'in': {
      // Rule value should be comma-separated list
      const values = ruleStr.split(',').map((v) => v.trim());
      return values.includes(contextStr);
    }

    case 'not_in': {
      // Rule value should be comma-separated list
      const values = ruleStr.split(',').map((v) => v.trim());
      return !values.includes(contextStr);
    }

    default:
      return false;
  }
}

/**
 * Check if a context matches a segment's rules
 * All rules must match (AND logic)
 */
function matchesSegment(
  segment: SegmentDefinition,
  context: EvaluationContext,
): boolean {
  if (!segment.rules || segment.rules.length === 0) {
    return true; // Empty segment matches all
  }

  return segment.rules.every((rule) => {
    const contextValue = getContextValue(context, rule.field);
    return compareValues(contextValue, rule.value, rule.operator);
  });
}

/**
 * Get a value from the context by field name
 * Supports special fields like 'targetingKey'
 */
function getContextValue(
  context: EvaluationContext,
  field: string,
): unknown {
  if (field === 'targetingKey' || field === 'identityId') {
    return context.targetingKey;
  }
  return context[field];
}

/**
 * Check if a rule matches the given context
 */
function matchesRule(
  rule: FlagRuleDefinition,
  context: EvaluationContext | undefined,
  segmentsMap: Map<string, SegmentDefinition>,
): boolean {
  // If rule has a segment requirement, check segment match first
  if (rule.segmentKey) {
    const segment = segmentsMap.get(rule.segmentKey);
    if (!segment) {
      return false; // Segment not found, rule doesn't match
    }
    if (!context || !matchesSegment(segment, context)) {
      return false;
    }
  }

  // If rule has percentage rollout, check that
  if (
    rule.rolloutPercentage !== null &&
    rule.rolloutPercentage !== undefined &&
    rule.rolloutPercentage < 100
  ) {
    const targetingKey = context?.targetingKey;
    if (!targetingKey) {
      // No targeting key, can't evaluate percentage rollout
      // Treat as not matching to be safe
      return false;
    }

    const percentage = hashToPercentage(targetingKey);
    if (percentage >= rule.rolloutPercentage) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate a single flag against a context
 */
export function evaluateFlag(
  flagDef: FlagDefinition,
  context: EvaluationContext | undefined,
  segmentsMap: Map<string, SegmentDefinition>,
): LocalEvaluationResult {
  // Sort rules by priority (lower = higher priority)
  const sortedRules = [...(flagDef.rules || [])].sort(
    (a, b) => a.priority - b.priority,
  );

  // Find the first matching rule
  for (const rule of sortedRules) {
    if (matchesRule(rule, context, segmentsMap)) {
      const reason: ResolutionReason = rule.segmentKey
        ? 'TARGETING_MATCH'
        : rule.rolloutPercentage !== null &&
            rule.rolloutPercentage !== undefined
          ? 'SPLIT'
          : 'STATIC';

      return {
        flag: {
          flagKey: flagDef.key,
          enabled: rule.enabled,
          valueType: flagDef.valueType,
          value: rule.enabled ? (rule.value ?? flagDef.defaultValue) : null,
          reason,
        },
        matchedRule: rule,
        matchedSegment: rule.segmentKey ?? undefined,
      };
    }
  }

  // No rules matched, use defaults
  return {
    flag: {
      flagKey: flagDef.key,
      enabled: flagDef.defaultEnabled,
      valueType: flagDef.valueType,
      value: flagDef.defaultEnabled ? flagDef.defaultValue : null,
      reason: 'DEFAULT',
    },
  };
}

/**
 * Local flag evaluator class
 *
 * Evaluates flags using a cached configuration without making API calls.
 */
export class FlagEvaluator {
  private config: FlagConfiguration | null = null;
  private flagsMap: Map<string, FlagDefinition> = new Map();
  private segmentsMap: Map<string, SegmentDefinition> = new Map();

  /**
   * Update the configuration used for evaluation
   */
  setConfiguration(config: FlagConfiguration): void {
    this.config = config;

    // Build lookup maps for efficient evaluation
    this.flagsMap.clear();
    this.segmentsMap.clear();

    for (const flag of config.flags) {
      this.flagsMap.set(flag.key, flag);
    }

    for (const segment of config.segments) {
      this.segmentsMap.set(segment.key, segment);
    }
  }

  /**
   * Get the current configuration
   */
  getConfiguration(): FlagConfiguration | null {
    return this.config;
  }

  /**
   * Check if configuration is loaded
   */
  isReady(): boolean {
    return this.config !== null;
  }

  /**
   * Get the current ETag for cache validation
   */
  getETag(): string | undefined {
    return this.config?.etag;
  }

  /**
   * Evaluate a single flag
   */
  evaluate(
    flagKey: string,
    context?: EvaluationContext,
  ): EvaluatedFlag {
    const flagDef = this.flagsMap.get(flagKey);

    if (!flagDef) {
      return {
        flagKey,
        enabled: false,
        valueType: 'boolean',
        value: null,
        reason: 'ERROR',
        errorCode: 'FLAG_NOT_FOUND',
        errorMessage: `Flag '${flagKey}' not found`,
      };
    }

    const result = evaluateFlag(flagDef, context, this.segmentsMap);
    return result.flag;
  }

  /**
   * Evaluate all flags and return a snapshot
   */
  evaluateAll(context?: EvaluationContext): EvaluatedFlag[] {
    const results: EvaluatedFlag[] = [];

    for (const flagDef of this.flagsMap.values()) {
      const result = evaluateFlag(flagDef, context, this.segmentsMap);
      results.push(result.flag);
    }

    return results;
  }

  /**
   * Get all flag keys in the configuration
   */
  getFlagKeys(): string[] {
    return Array.from(this.flagsMap.keys());
  }

  /**
   * Check if a flag exists in the configuration
   */
  hasFlag(flagKey: string): boolean {
    return this.flagsMap.has(flagKey);
  }
}
