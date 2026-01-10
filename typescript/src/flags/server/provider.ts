import type {
  Provider,
  ResolutionDetails,
  EvaluationContext,
  JsonValue,
  ProviderMetadata,
  Hook,
  ProviderStatus,
  ErrorCode,
  FlagMetadata,
} from '@openfeature/server-sdk';
import { FlagsClient } from '../client.js';
import type { EvaluationContext as KitbaseContext } from '../types.js';

/**
 * Configuration options for KitbaseProvider (Server)
 */
export interface KitbaseProviderOptions {
  /**
   * Your Kitbase API key
   */
  token: string;

  /**
   * Enable flag caching (default: true)
   */
  cache?: boolean;

  /**
   * Cache TTL in milliseconds (default: 60000 = 1 minute)
   */
  cacheTtl?: number;
}

interface CacheEntry {
  value: unknown;
  variant?: string;
  reason: string;
  errorCode?: ErrorCode;
  errorMessage?: string;
  flagMetadata?: FlagMetadata;
  valueType: string;
  timestamp: number;
}

/**
 * Kitbase OpenFeature Provider for Server-side applications
 *
 * Implements the official OpenFeature Provider interface from @openfeature/server-sdk
 * for seamless integration with the OpenFeature ecosystem.
 *
 * @example
 * ```typescript
 * import { OpenFeature } from '@openfeature/server-sdk';
 * import { KitbaseProvider } from '@kitbase/sdk/flags/server';
 *
 * // Register the provider
 * await OpenFeature.setProviderAndWait(new KitbaseProvider({
 *   token: 'YOUR_API_KEY'
 * }));
 *
 * // Get a client and evaluate flags
 * const client = OpenFeature.getClient();
 * const isEnabled = await client.getBooleanValue('dark-mode', false, {
 *   targetingKey: 'user-123'
 * });
 * ```
 */
export class KitbaseProvider implements Provider {
  readonly metadata: ProviderMetadata = {
    name: 'kitbase',
  };

  readonly rulesChanged?: () => void;
  readonly hooks?: Hook[];
  status?: ProviderStatus;

  private readonly client: FlagsClient;
  private readonly cacheEnabled: boolean;
  private readonly cacheTtl: number;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(options: KitbaseProviderOptions) {
    this.client = new FlagsClient({ token: options.token });
    this.cacheEnabled = options.cache ?? true;
    this.cacheTtl = options.cacheTtl ?? 60000;
    this.status = 'NOT_READY' as ProviderStatus;
  }

  /**
   * Initialize the provider
   */
  async initialize(): Promise<void> {
    // Provider is ready immediately - no async setup needed
    this.status = 'READY' as ProviderStatus;
  }

  /**
   * Shutdown the provider
   */
  async onClose(): Promise<void> {
    this.cache.clear();
    this.status = 'NOT_READY' as ProviderStatus;
  }

  /**
   * Resolve a boolean flag evaluation
   */
  async resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<boolean>> {
    return this.resolveEvaluation(flagKey, defaultValue, context, 'boolean');
  }

  /**
   * Resolve a string flag evaluation
   */
  async resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<string>> {
    return this.resolveEvaluation(flagKey, defaultValue, context, 'string');
  }

  /**
   * Resolve a number flag evaluation
   */
  async resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<number>> {
    return this.resolveEvaluation(flagKey, defaultValue, context, 'number');
  }

  /**
   * Resolve an object flag evaluation
   */
  async resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<T>> {
    return this.resolveEvaluation(flagKey, defaultValue, context, 'json');
  }

  /**
   * Prefetch all flags for a context (useful for caching)
   */
  async prefetchFlags(context?: EvaluationContext): Promise<void> {
    const kitbaseContext = this.toKitbaseContext(context);
    const snapshot = await this.client.getSnapshot({ context: kitbaseContext });

    for (const flag of snapshot.flags) {
      const cacheKey = this.getCacheKey(flag.flagKey, context);
      this.cache.set(cacheKey, {
        value: flag.value,
        variant: flag.variant,
        reason: flag.reason,
        errorCode: flag.errorCode as ErrorCode | undefined,
        errorMessage: flag.errorMessage,
        flagMetadata: flag.flagMetadata as FlagMetadata | undefined,
        valueType: flag.valueType,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Clear the flag cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generic evaluation resolution
   */
  private async resolveEvaluation<T>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    expectedType: 'boolean' | 'string' | 'number' | 'json',
  ): Promise<ResolutionDetails<T>> {
    // Check cache first
    if (this.cacheEnabled) {
      const cached = this.getCachedValue<T>(flagKey, context, expectedType);
      if (cached) {
        return cached;
      }
    }

    try {
      const kitbaseContext = this.toKitbaseContext(context);
      const flag = await this.client.evaluateFlag(flagKey, {
        context: kitbaseContext,
        defaultValue,
      });

      // Check for type mismatch
      if (flag.valueType !== expectedType) {
        return {
          value: defaultValue,
          reason: 'ERROR',
          errorCode: 'TYPE_MISMATCH' as ErrorCode,
          errorMessage: `Expected ${expectedType}, got ${flag.valueType}`,
        };
      }

      // Cache the result
      if (this.cacheEnabled) {
        this.setCachedValue(flagKey, context, flag, expectedType);
      }

      // Handle disabled flags or errors
      if (
        flag.errorCode === 'FLAG_NOT_FOUND' ||
        !flag.enabled ||
        flag.value === null ||
        flag.value === undefined
      ) {
        return {
          value: defaultValue,
          variant: flag.variant,
          reason: flag.reason,
          errorCode: flag.errorCode as ErrorCode | undefined,
          errorMessage: flag.errorMessage,
          flagMetadata: flag.flagMetadata as FlagMetadata | undefined,
        };
      }

      return {
        value: flag.value as T,
        variant: flag.variant,
        reason: flag.reason,
        errorCode: flag.errorCode as ErrorCode | undefined,
        errorMessage: flag.errorMessage,
        flagMetadata: flag.flagMetadata as FlagMetadata | undefined,
      };
    } catch (error) {
      // Return default on error (OpenFeature behavior)
      return {
        value: defaultValue,
        reason: 'ERROR',
        errorCode: 'GENERAL' as ErrorCode,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Convert OpenFeature context to Kitbase context
   */
  private toKitbaseContext(
    context?: EvaluationContext,
  ): KitbaseContext | undefined {
    if (!context) {
      return undefined;
    }
    return context as KitbaseContext;
  }

  /**
   * Get cache key for a flag + context combination
   */
  private getCacheKey(flagKey: string, context?: EvaluationContext): string {
    const contextKey = context?.targetingKey ?? 'anonymous';
    return `${flagKey}:${contextKey}`;
  }

  /**
   * Get cached value if valid
   */
  private getCachedValue<T>(
    flagKey: string,
    context: EvaluationContext | undefined,
    expectedType: string,
  ): ResolutionDetails<T> | null {
    const cacheKey = this.getCacheKey(flagKey, context);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTtl) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Check type match
    if (cached.valueType !== expectedType) {
      return null;
    }

    return {
      value: cached.value as T,
      variant: cached.variant,
      reason: 'CACHED',
      errorCode: cached.errorCode,
      errorMessage: cached.errorMessage,
      flagMetadata: cached.flagMetadata,
    };
  }

  /**
   * Set cached value
   */
  private setCachedValue(
    flagKey: string,
    context: EvaluationContext | undefined,
    flag: {
      value: unknown;
      variant?: string;
      reason: string;
      errorCode?: string;
      errorMessage?: string;
      flagMetadata?: Record<string, unknown>;
      valueType: string;
    },
    valueType: string,
  ): void {
    const cacheKey = this.getCacheKey(flagKey, context);
    this.cache.set(cacheKey, {
      value: flag.value,
      variant: flag.variant,
      reason: flag.reason,
      errorCode: flag.errorCode as ErrorCode | undefined,
      errorMessage: flag.errorMessage,
      flagMetadata: flag.flagMetadata as FlagMetadata | undefined,
      valueType,
      timestamp: Date.now(),
    });
  }
}
