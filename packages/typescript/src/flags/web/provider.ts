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
import type { FlagsConfig, EvaluationContext as KitbaseContext } from '../types.js';

/**
 * Configuration options for KitbaseProvider (Web)
 */
export type KitbaseProviderOptions = FlagsConfig

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
 * - Caches flag values to minimize network requests (via FlagsClient)
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
  private initContext?: EvaluationContext;

  constructor(options: KitbaseProviderOptions) {
    this.client = new FlagsClient(options);
    this.status = 'NOT_READY' as ProviderStatus;
  }

  /**
   * Initialize the provider with context
   */
  async initialize(context?: EvaluationContext): Promise<void> {
    this.initContext = context;

    await this.prefetchFlags(context);

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
    this.client.clearCache();

    // Prefetch flags with new context
    await this.prefetchFlags(newContext);
  }

  /**
   * Shutdown the provider
   */
  async onClose(): Promise<void> {
    this.client.clearCache();
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
   * FlagsClient handles caching and localStorage, we populate our sync cache from the results
   */
  async prefetchFlags(context?: EvaluationContext): Promise<void> {
    try {
      const kitbaseContext = this.toKitbaseContext(context);
      // getSnapshot is cached by FlagsClient (checks localStorage, makes API call if needed)
      await this.client.getSnapshot({
        context: kitbaseContext,
      });

    } catch (error) {
      // Log error but don't throw - provider can still work with defaults
      console.warn('[Kitbase] Failed to prefetch flags:', error);
    }
  }

  /**
   * Clear the flag cache
   */
  clearCache(): void {
    this.client.clearCache();
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
  
    // If not in cache and we're supposed to prefetch, return STALE with default
    return {
      value: defaultValue,
      reason: 'STALE',
      errorCode: 'FLAG_NOT_FOUND' as ErrorCode,
      errorMessage: `Flag '${flagKey}' not found in cache. Call refresh() or wait for initialization.`,
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

}
