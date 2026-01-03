import type {
  Provider,
  ResolutionDetails,
  EvaluationContext,
  JsonValue,
  ProviderMetadata,
  Hook,
  ProviderStatus,
  OpenFeatureEventEmitter,
  ErrorCode,
  FlagMetadata,
} from '@openfeature/web-sdk';
import { FlagsClient } from '../client.js';
import type { EvaluationContext as KitbaseContext } from '../types.js';

/**
 * Configuration options for KitbaseProvider (Web)
 */
export interface KitbaseProviderOptions {
  /**
   * Your Kitbase API key
   */
  token: string;

  /**
   * Cache TTL in milliseconds (default: 300000 = 5 minutes)
   * Web clients typically use longer TTL to reduce network requests
   */
  cacheTtl?: number;

  /**
   * Prefetch all flags on initialization (default: true)
   * Recommended for web applications to minimize latency
   */
  prefetchOnInit?: boolean;
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
 * Kitbase OpenFeature Provider for Web/Browser applications
 *
 * Implements the official OpenFeature Provider interface from @openfeature/web-sdk
 * for seamless integration with the OpenFeature ecosystem in browser environments.
 *
 * Key features:
 * - Prefetches all flags on initialization for low-latency evaluations
 * - Caches flag values to minimize network requests
 * - Supports context-based targeting
 *
 * @example
 * ```typescript
 * import { OpenFeature } from '@openfeature/web-sdk';
 * import { KitbaseProvider } from '@kitbase/sdk/flags/web';
 *
 * // Register the provider with initial context
 * await OpenFeature.setProviderAndWait(new KitbaseProvider({
 *   token: 'YOUR_API_KEY',
 *   prefetchOnInit: true
 * }), {
 *   targetingKey: 'user-123',
 *   plan: 'premium'
 * });
 *
 * // Get a client and evaluate flags (uses cached values)
 * const client = OpenFeature.getClient();
 * const isEnabled = client.getBooleanValue('dark-mode', false);
 * ```
 */
export class KitbaseProvider implements Provider {
  readonly metadata: ProviderMetadata = {
    name: 'kitbase',
  };

  readonly rulesChanged?: () => void;
  readonly hooks?: Hook[];
  status: ProviderStatus;
  events?: OpenFeatureEventEmitter;

  private readonly client: FlagsClient;
  private readonly cacheTtl: number;
  private readonly prefetchOnInit: boolean;
  private cache: Map<string, CacheEntry> = new Map();
  private initContext?: EvaluationContext;

  constructor(options: KitbaseProviderOptions) {
    this.client = new FlagsClient({ token: options.token });
    this.cacheTtl = options.cacheTtl ?? 300000; // 5 minutes default for web
    this.prefetchOnInit = options.prefetchOnInit ?? true;
    this.status = 'NOT_READY' as ProviderStatus;
  }

  /**
   * Initialize the provider with context
   * Prefetches all flags if prefetchOnInit is enabled
   */
  async initialize(context?: EvaluationContext): Promise<void> {
    this.initContext = context;

    if (this.prefetchOnInit) {
      await this.prefetchFlags(context);
    }

    this.status = 'READY' as ProviderStatus;
  }

  /**
   * Handle context changes by refetching flags
   */
  async onContextChange(
    _oldContext: EvaluationContext,
    newContext: EvaluationContext,
  ): Promise<void> {
    // Clear cache when context changes
    this.cache.clear();

    // Prefetch flags with new context
    if (this.prefetchOnInit) {
      await this.prefetchFlags(newContext);
    }
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
  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
  ): ResolutionDetails<boolean> {
    return this.resolveEvaluation(flagKey, defaultValue, context, 'boolean');
  }

  /**
   * Resolve a string flag evaluation
   */
  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
  ): ResolutionDetails<string> {
    return this.resolveEvaluation(flagKey, defaultValue, context, 'string');
  }

  /**
   * Resolve a number flag evaluation
   */
  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
  ): ResolutionDetails<number> {
    return this.resolveEvaluation(flagKey, defaultValue, context, 'number');
  }

  /**
   * Resolve an object flag evaluation
   */
  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
  ): ResolutionDetails<T> {
    return this.resolveEvaluation(flagKey, defaultValue, context, 'json');
  }

  /**
   * Prefetch all flags for a context
   */
  async prefetchFlags(context?: EvaluationContext): Promise<void> {
    try {
      const kitbaseContext = this.toKitbaseContext(context);
      const snapshot = await this.client.getSnapshot({
        context: kitbaseContext,
      });

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
    } catch (error) {
      // Log error but don't throw - provider can still work with defaults
      console.warn('[Kitbase] Failed to prefetch flags:', error);
    }
  }

  /**
   * Clear the flag cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Refresh flags with current context
   */
  async refresh(): Promise<void> {
    await this.prefetchFlags(this.initContext);
  }

  /**
   * Synchronous evaluation resolution (uses cache for web)
   * Web SDK uses synchronous resolution for better performance
   */
  private resolveEvaluation<T>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    expectedType: 'boolean' | 'string' | 'number' | 'json',
  ): ResolutionDetails<T> {
    // Check cache
    const cached = this.getCachedValue<T>(flagKey, context, expectedType);
    if (cached) {
      return cached;
    }

    // If not in cache and we're supposed to prefetch, return STALE with default
    if (this.prefetchOnInit) {
      return {
        value: defaultValue,
        reason: 'STALE',
        errorCode: 'FLAG_NOT_FOUND' as ErrorCode,
        errorMessage: `Flag '${flagKey}' not found in cache. Call refresh() or wait for initialization.`,
      };
    }

    // Return default for unknown flags
    return {
      value: defaultValue,
      reason: 'DEFAULT',
    };
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
      return {
        value: null as T,
        reason: 'ERROR',
        errorCode: 'TYPE_MISMATCH' as ErrorCode,
        errorMessage: `Expected ${expectedType}, got ${cached.valueType}`,
      };
    }

    // Handle disabled/null values
    if (cached.value === null || cached.value === undefined) {
      return {
        value: null as T,
        variant: cached.variant,
        reason: cached.reason as ResolutionDetails<T>['reason'],
        errorCode: cached.errorCode,
        errorMessage: cached.errorMessage,
        flagMetadata: cached.flagMetadata,
      };
    }

    return {
      value: cached.value as T,
      variant: cached.variant,
      reason: 'CACHED',
      flagMetadata: cached.flagMetadata,
    };
  }
}
