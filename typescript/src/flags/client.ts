/**
 * Unified feature flag client
 *
 * Supports two evaluation modes:
 * - Remote evaluation (default): Each flag evaluation makes an API call
 * - Local evaluation: Fetches config once and evaluates flags locally
 */

import type { FlagConfiguration } from './config-types.js';
import type {
  FlagsConfig,
  EvaluationContext,
  EvaluatedFlag,
  FlagSnapshot,
  EvaluateOptions,
  EvaluateFlagOptions,
  ResolutionDetails,
  SnapshotPayload,
  EvaluateFlagPayload,
  JsonValue,
} from './types.js';
import { FlagEvaluator } from './evaluator.js';
import {
  ApiError,
  AuthenticationError,
  FlagNotFoundError,
  TimeoutError,
  TypeMismatchError,
  ValidationError,
} from './errors.js';

const BASE_URL = 'https://api.kitbase.dev';
const TIMEOUT = 30000;

/**
 * Event types emitted by the FlagsClient (local evaluation mode only)
 */
export type FlagsClientEvent =
  | { type: 'ready'; config: FlagConfiguration }
  | { type: 'configurationChanged'; config: FlagConfiguration }
  | { type: 'error'; error: Error };

/**
 * Listener function for FlagsClient events
 */
export type FlagsClientListener = (event: FlagsClientEvent) => void;

/**
 * Kitbase Feature Flags client for evaluating feature flags
 *
 * Supports two evaluation modes:
 * - **Remote evaluation** (default): Each flag evaluation makes an API call to Kitbase
 * - **Local evaluation**: Fetches configuration once and evaluates flags locally
 *
 * @example Remote evaluation (default)
 * ```typescript
 * import { FlagsClient } from '@kitbase/sdk/flags';
 *
 * const flags = new FlagsClient({
 *   token: '<YOUR_API_KEY>',
 * });
 *
 * // Each call makes an API request
 * const isEnabled = await flags.getBooleanValue('dark-mode', false, {
 *   targetingKey: 'user-123',
 * });
 * ```
 *
 * @example Local evaluation
 * ```typescript
 * import { FlagsClient } from '@kitbase/sdk/flags';
 *
 * const flags = new FlagsClient({
 *   token: '<YOUR_API_KEY>',
 *   enableLocalEvaluation: true,
 *   environmentRefreshIntervalSeconds: 60,
 * });
 *
 * // Evaluates locally (no network call)
 * const isEnabled = await flags.getBooleanValue('dark-mode', false, {
 *   targetingKey: 'user-123',
 * });
 *
 * ```
 */
interface CacheEntry {
  value: unknown;
  timestamp: number;
}

export class FlagsClient {
  private readonly token: string;
  private readonly enableLocalEvaluation: boolean;
  private readonly pollingInterval: number;
  private readonly onConfigurationChange?: (config: FlagConfiguration) => void;
  private readonly onError?: (error: Error) => void;
  private readonly cacheTtl: number;
  private readonly enablePersistentCache: boolean;
  private readonly baseUrl: string;

  // Local evaluation state
  private evaluator: FlagEvaluator | null = null;
  private listeners: Set<FlagsClientListener> = new Set();
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  // Remote evaluation cache (only used when enableLocalEvaluation is false)
  private cache: Map<string, CacheEntry> = new Map();

  constructor(config: FlagsConfig) {
    if (!config.token) {
      throw new ValidationError('API token is required', 'token');
    }
    this.baseUrl = config.baseUrl ?? BASE_URL;
    this.token = config.token;
    this.enableLocalEvaluation = config.enableLocalEvaluation ?? false;
    this.pollingInterval =
      (config.environmentRefreshIntervalSeconds ?? 60) * 1000;
    this.onConfigurationChange = config.onConfigurationChange;
    this.onError = config.onError;
    this.cacheTtl = config.cacheTtl ?? 60000; // 1 minutes default
    this.enablePersistentCache =
      config.enablePersistentCache ??
      this.isLocalStorageAvailable()

    // Initialize evaluator for local evaluation mode
    if (this.enableLocalEvaluation) {
      this.evaluator = new FlagEvaluator();

      // Use initial config if provided
      if (config.initialConfiguration) {
        this.evaluator.setConfiguration(config.initialConfiguration);
      } else {
        // Try to load cached configuration from localStorage
        if (this.enablePersistentCache) {
          this.loadConfigurationFromStorage();
        }
      }
    } else {
      // Load cache from localStorage for remote evaluation mode
      if (this.enablePersistentCache) {
        this.loadCacheFromStorage();
      }
    }
  }

  // ==================== Initialization (Local Evaluation Only) ====================

  /**
   * Initialize the client by fetching the initial configuration.
   * When `enableLocalEvaluation` is true, this is called automatically on first evaluation.
   * Can also be called manually to initialize early.
   *
   * @returns Promise that resolves when configuration is loaded
   * @throws {AuthenticationError} When the API key is invalid
   * @throws {ApiError} When the API returns an error
   * @throws {TimeoutError} When the request times out
   */
  async initialize(): Promise<void> {
    if (!this.enableLocalEvaluation) {
      // No-op for remote evaluation mode
      return;
    }

    // Prevent multiple concurrent initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      // If already initialized (e.g., from cached config), just start polling
      if (this.initialized) {
        if (this.pollingInterval > 0) {
          this.startPolling();
        }
        const config = this.evaluator!.getConfiguration();
        if (config) {
          this.emit({ type: 'ready', config });
        }
        return;
      }

      await this.fetchConfiguration();
      this.initialized = true;

      // Start polling for updates if interval is set
      if (this.pollingInterval > 0) {
        this.startPolling();
      }

      // Emit ready event
      const config = this.evaluator!.getConfiguration();
      if (config) {
        this.emit({ type: 'ready', config });
      }
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Check if the client is ready for flag evaluation.
   * For remote evaluation, always returns true.
   * For local evaluation, returns true after initialize() completes.
   */
  isReady(): boolean {
    if (!this.enableLocalEvaluation) {
      return true;
    }
    return this.initialized && this.evaluator!.isReady();
  }

  /**
   * Add an event listener (local evaluation mode only).
   * Events: 'ready', 'configurationChanged', 'error'
   */
  on(listener: FlagsClientListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove an event listener
   */
  off(listener: FlagsClientListener): void {
    this.listeners.delete(listener);
  }

  private emit(event: FlagsClientEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }

  /**
   * Close the client and stop all background updates.
   * Only has effect in local evaluation mode.
   */
  close(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    this.listeners.clear();
  }

  /**
   * Manually refresh the configuration (local evaluation mode only).
   *
   * @returns Promise that resolves when configuration is updated
   */
  async refresh(): Promise<void> {
    if (!this.enableLocalEvaluation) {
      return;
    }
    await this.fetchConfiguration();
  }

  /**
   * Get the current configuration (local evaluation mode only).
   */
  getConfiguration(): FlagConfiguration | null {
    return this.evaluator?.getConfiguration() ?? null;
  }

  /**
   * Get a cached snapshot synchronously (for synchronous providers like OpenFeature web SDK)
   * Returns null if not cached or expired
   */
  getCachedSnapshotSync(context?: EvaluationContext): FlagSnapshot | null {
    if (this.enableLocalEvaluation) {
      // For local evaluation, we can generate snapshot synchronously
      if (!this.evaluator?.isReady()) {
        return null;
      }
      const config = this.evaluator.getConfiguration()!;
      const flags = this.evaluator.evaluateAll(context);
      return {
        projectId: '',
        environmentId: config.environmentId,
        evaluatedAt: new Date().toISOString(),
        flags,
      };
    }

    // For remote evaluation, check cache
    const cacheKey = this.getSnapshotCacheKey(context);
    return this.getCachedValue<FlagSnapshot>(cacheKey);
  }

  // ==================== Flag Evaluation Methods ====================

  /**
   * Get a snapshot of all evaluated feature flags
   *
   * @param options - Evaluation options including context
   * @returns Promise resolving to the flag snapshot
   * @throws {AuthenticationError} When the API key is invalid
   * @throws {ApiError} When the API returns an error
   * @throws {TimeoutError} When the request times out
   */
  async getSnapshot(options?: EvaluateOptions): Promise<FlagSnapshot> {
    if (this.enableLocalEvaluation) {
      await this.ensureLocalReady();
      const config = this.evaluator!.getConfiguration()!;
      const flags = this.evaluator!.evaluateAll(options?.context);
      return {
        projectId: '',
        environmentId: config.environmentId,
        evaluatedAt: new Date().toISOString(),
        flags,
      };
    }

    // Check cache for remote evaluation
    const cacheKey = this.getSnapshotCacheKey(options?.context);
    const cached = this.getCachedValue<FlagSnapshot>(cacheKey);
    if (cached) {
      return cached;
    }

    const payload = this.buildSnapshotPayload(options?.context);
    const snapshot = await this.request<FlagSnapshot>(
      '/v1/feature-flags/snapshot',
      payload,
    );

    // Cache the result
    this.setCachedValue(cacheKey, snapshot);

    return snapshot;
  }

  /**
   * Evaluate a single feature flag with full resolution details
   *
   * @param flagKey - The key of the flag to evaluate
   * @param options - Evaluation options including context and default value
   * @returns Promise resolving to the evaluated flag with resolution details
   * @throws {ValidationError} When flagKey is missing
   * @throws {AuthenticationError} When the API key is invalid
   * @throws {ApiError} When the API returns an error
   * @throws {TimeoutError} When the request times out
   */
  async evaluateFlag(
    flagKey: string,
    options?: EvaluateFlagOptions,
  ): Promise<EvaluatedFlag> {
    if (!flagKey) {
      throw new ValidationError('Flag key is required', 'flagKey');
    }

    if (this.enableLocalEvaluation) {
      await this.ensureLocalReady();
      return this.evaluator!.evaluate(flagKey, options?.context);
    }

    // Check cache for remote evaluation
    const cacheKey = this.getEvaluateFlagCacheKey(flagKey, options?.context);
    const cached = this.getCachedValue<EvaluatedFlag>(cacheKey);
    if (cached) {
      return cached;
    }

    const payload = this.buildEvaluateFlagPayload(
      flagKey,
      options?.context,
      options?.defaultValue,
    );
    const flag = await this.request<EvaluatedFlag>(
      '/v1/feature-flags/evaluate',
      payload,
    );

    // Cache the result
    this.setCachedValue(cacheKey, flag);

    return flag;
  }

  /**
   * Get a boolean flag value
   *
   * @param flagKey - The key of the flag to evaluate
   * @param defaultValue - Default value if flag cannot be evaluated
   * @param context - Optional evaluation context
   * @returns Promise resolving to the boolean value
   * @throws {TypeMismatchError} When the flag is not a boolean type
   */
  async getBooleanValue(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
  ): Promise<boolean> {
    const result = await this.getBooleanDetails(flagKey, defaultValue, context);
    return result.value;
  }

  /**
   * Get a boolean flag value with full resolution details
   *
   * @param flagKey - The key of the flag to evaluate
   * @param defaultValue - Default value if flag cannot be evaluated
   * @param context - Optional evaluation context
   * @returns Promise resolving to resolution details with boolean value
   */
  async getBooleanDetails(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
  ): Promise<ResolutionDetails<boolean>> {
    const flag = await this.evaluateFlag(flagKey, {
      context,
      defaultValue,
    });

    return this.toResolutionDetails(flag, defaultValue, 'boolean');
  }

  /**
   * Get a string flag value
   *
   * @param flagKey - The key of the flag to evaluate
   * @param defaultValue - Default value if flag cannot be evaluated
   * @param context - Optional evaluation context
   * @returns Promise resolving to the string value
   * @throws {TypeMismatchError} When the flag is not a string type
   */
  async getStringValue(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
  ): Promise<string> {
    const result = await this.getStringDetails(flagKey, defaultValue, context);
    return result.value;
  }

  /**
   * Get a string flag value with full resolution details
   *
   * @param flagKey - The key of the flag to evaluate
   * @param defaultValue - Default value if flag cannot be evaluated
   * @param context - Optional evaluation context
   * @returns Promise resolving to resolution details with string value
   */
  async getStringDetails(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
  ): Promise<ResolutionDetails<string>> {
    const flag = await this.evaluateFlag(flagKey, {
      context,
      defaultValue,
    });

    return this.toResolutionDetails(flag, defaultValue, 'string');
  }

  /**
   * Get a number flag value
   *
   * @param flagKey - The key of the flag to evaluate
   * @param defaultValue - Default value if flag cannot be evaluated
   * @param context - Optional evaluation context
   * @returns Promise resolving to the number value
   * @throws {TypeMismatchError} When the flag is not a number type
   */
  async getNumberValue(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
  ): Promise<number> {
    const result = await this.getNumberDetails(flagKey, defaultValue, context);
    return result.value;
  }

  /**
   * Get a number flag value with full resolution details
   *
   * @param flagKey - The key of the flag to evaluate
   * @param defaultValue - Default value if flag cannot be evaluated
   * @param context - Optional evaluation context
   * @returns Promise resolving to resolution details with number value
   */
  async getNumberDetails(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
  ): Promise<ResolutionDetails<number>> {
    const flag = await this.evaluateFlag(flagKey, {
      context,
      defaultValue,
    });

    return this.toResolutionDetails(flag, defaultValue, 'number');
  }

  /**
   * Get a JSON object flag value
   *
   * @param flagKey - The key of the flag to evaluate
   * @param defaultValue - Default value if flag cannot be evaluated
   * @param context - Optional evaluation context
   * @returns Promise resolving to the JSON value
   * @throws {TypeMismatchError} When the flag is not a json type
   */
  async getJsonValue<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
  ): Promise<T> {
    const result = await this.getJsonDetails(flagKey, defaultValue, context);
    return result.value;
  }

  /**
   * Get a JSON object flag value with full resolution details
   *
   * @param flagKey - The key of the flag to evaluate
   * @param defaultValue - Default value if flag cannot be evaluated
   * @param context - Optional evaluation context
   * @returns Promise resolving to resolution details with JSON value
   */
  async getJsonDetails<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
  ): Promise<ResolutionDetails<T>> {
    const flag = await this.evaluateFlag(flagKey, {
      context,
      defaultValue,
    });

    return this.toResolutionDetails(flag, defaultValue, 'json');
  }

  /**
   * Check if a flag exists (local evaluation mode only)
   */
  hasFlag(flagKey: string): boolean {
    return this.evaluator?.hasFlag(flagKey) ?? false;
  }

  /**
   * Get all flag keys (local evaluation mode only)
   */
  getFlagKeys(): string[] {
    return this.evaluator?.getFlagKeys() ?? [];
  }

  // ==================== Private Methods ====================

  private async ensureLocalReady(): Promise<void> {
    if (!this.evaluator?.isReady()) {
      await this.initialize();
    }
  }

  /**
   * Convert API response to typed resolution details
   */
  private toResolutionDetails<T>(
    flag: EvaluatedFlag,
    defaultValue: T,
    expectedType: 'boolean' | 'string' | 'number' | 'json',
  ): ResolutionDetails<T> {
    // Check for errors from the API
    if (flag.errorCode === 'FLAG_NOT_FOUND') {
      return {
        value: defaultValue,
        reason: 'ERROR',
        errorCode: 'FLAG_NOT_FOUND',
        errorMessage: flag.errorMessage,
        flagMetadata: flag.flagMetadata,
      };
    }

    // Type validation
    if (flag.valueType !== expectedType) {
      throw new TypeMismatchError(flag.flagKey, expectedType, flag.valueType);
    }

    // Handle disabled flags
    if (!flag.enabled || flag.value === null || flag.value === undefined) {
      return {
        value: defaultValue,
        variant: flag.variant,
        reason: flag.reason,
        errorCode: flag.errorCode,
        errorMessage: flag.errorMessage,
        flagMetadata: flag.flagMetadata,
      };
    }

    return {
      value: flag.value as T,
      variant: flag.variant,
      reason: flag.reason,
      errorCode: flag.errorCode,
      errorMessage: flag.errorMessage,
      flagMetadata: flag.flagMetadata,
    };
  }

  /**
   * Build snapshot request payload from evaluation context
   */
  private buildSnapshotPayload(
    context?: EvaluationContext,
  ): SnapshotPayload | undefined {
    if (!context) {
      return undefined;
    }

    const { targetingKey, ...rest } = context;

    return {
      ...(targetingKey && { identityId: targetingKey }),
      ...(Object.keys(rest).length > 0 && { context: rest }),
    };
  }

  /**
   * Build evaluate flag request payload
   */
  private buildEvaluateFlagPayload(
    flagKey: string,
    context?: EvaluationContext,
    defaultValue?: unknown,
  ): EvaluateFlagPayload {
    const { targetingKey, ...rest } = context ?? {};

    return {
      flagKey,
      ...(targetingKey && { identityId: targetingKey }),
      ...(Object.keys(rest).length > 0 && { context: rest }),
      ...(defaultValue !== undefined && { defaultValue }),
    };
  }

  private async request<T>(endpoint: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${this.token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await this.parseResponseBody(response);

        if (response.status === 401) {
          throw new AuthenticationError();
        }

        if (response.status === 404) {
          const flagKey = this.extractFlagKeyFromError(errorBody);
          if (flagKey) {
            throw new FlagNotFoundError(flagKey);
          }
        }

        throw new ApiError(
          this.getErrorMessage(errorBody, response.statusText),
          response.status,
          errorBody,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError();
      }

      throw error;
    }
  }

  // ==================== Local Evaluation Methods ====================

  private async fetchConfiguration(): Promise<void> {
    const url = `${BASE_URL}/v1/feature-flags/config`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const headers: Record<string, string> = {
        'X-API-Key': this.token,
      };

      // Add ETag for cache validation
      const currentETag = this.evaluator?.getETag();
      if (currentETag) {
        headers['If-None-Match'] = currentETag;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Not modified - configuration hasn't changed
      if (response.status === 304) {
        return;
      }

      if (!response.ok) {
        const errorBody = await this.parseResponseBody(response);

        if (response.status === 401) {
          throw new AuthenticationError();
        }

        throw new ApiError(
          this.getErrorMessage(errorBody, response.statusText),
          response.status,
          errorBody,
        );
      }

      const config = (await response.json()) as FlagConfiguration;
      this.updateConfiguration(config);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError();
      }

      throw error;
    }
  }

  private updateConfiguration(config: FlagConfiguration): void {
    const previousConfig = this.evaluator?.getConfiguration();
    this.evaluator!.setConfiguration(config);

    // Save configuration to localStorage for local evaluation mode
    if (this.enableLocalEvaluation && this.enablePersistentCache) {
      this.saveConfigurationToStorage(config);
    }

    // Notify listeners if config changed
    if (previousConfig && previousConfig.etag !== config.etag) {
      this.emit({ type: 'configurationChanged', config });
      this.onConfigurationChange?.(config);
    }
  }

  private startPolling(): void {
    if (this.pollingTimer) {
      return;
    }

    this.pollingTimer = setInterval(async () => {
      try {
        await this.fetchConfiguration();
      } catch (error) {
        this.handleError(error);
      }
    }, this.pollingInterval);
  }


  private handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.emit({ type: 'error', error: err });
    this.onError?.(err);
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private getErrorMessage(body: unknown, fallback: string): string {
    if (body && typeof body === 'object' && 'message' in body) {
      return String((body as { message: unknown }).message);
    }
    if (body && typeof body === 'object' && 'error' in body) {
      return String((body as { error: unknown }).error);
    }
    return fallback;
  }

  private extractFlagKeyFromError(body: unknown): string | null {
    if (body && typeof body === 'object' && 'flagKey' in body) {
      return String((body as { flagKey: unknown }).flagKey);
    }
    return null;
  }

  // ==================== Caching Methods ====================

  /**
   * Get cache key for snapshot request
   */
  private getSnapshotCacheKey(context?: EvaluationContext): string {
    const contextKey = context?.targetingKey ?? 'anonymous';
    return `snapshot:${contextKey}`;
  }

  /**
   * Get cache key for evaluate flag request
   */
  private getEvaluateFlagCacheKey(
    flagKey: string,
    context?: EvaluationContext,
  ): string {
    const contextKey = context?.targetingKey ?? 'anonymous';
    return `flag:${flagKey}:${contextKey}`;
  }

  /**
   * Get cached value if valid
   */
  private getCachedValue<T>(cacheKey: string): T | null {
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTtl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.value as T;
  }

  /**
   * Set cached value
   */
  private setCachedValue<T>(cacheKey: string, value: T): void {
    this.cache.set(cacheKey, {
      value,
      timestamp: Date.now(),
    });

    // Save to localStorage if enabled
    if (this.enablePersistentCache) {
      this.saveCacheToStorage();
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    if (this.enablePersistentCache) {
      this.clearStorageCache();
      if (this.enableLocalEvaluation) {
        this.clearConfigurationStorage();
      }
    }
  }

  /**
   * Get the localStorage key for this client instance
   */
  private getStorageKey(): string {
    // Use a hash of the token to create a unique key per API key
    const tokenHash = this.simpleHash(this.token);
    return `kitbase:flags:cache:${tokenHash}`;
  }

  /**
   * Simple hash function for token (not cryptographic, just for uniqueness)
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const test = '__kitbase_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const storageKey = this.getStorageKey();
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) {
        return;
      }

      const data = JSON.parse(stored) as {
        cache: Array<[string, CacheEntry]>;
        timestamp: number;
      };

      // Check if the stored cache is still valid (not expired)
      const age = Date.now() - data.timestamp;
      if (age > this.cacheTtl) {
        // Cache expired, remove it
        window.localStorage.removeItem(storageKey);
        return;
      }

      // Restore cache entries, filtering out expired ones
      const now = Date.now();
      for (const [key, entry] of data.cache) {
        // Only restore entries that haven't expired
        if (now - entry.timestamp <= this.cacheTtl) {
          this.cache.set(key, entry);
        }
      }
    } catch (error) {
      // If there's any error loading from storage, just continue without cache
      console.warn('[Kitbase] Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      const storageKey = this.getStorageKey();
      const data = {
        cache: Array.from(this.cache.entries()),
        timestamp: Date.now(),
      };
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      // If storage is full or unavailable, just continue without saving
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Storage is full, try to clear old entries
        this.clearStorageCache();
      }
    }
  }

  /**
   * Clear cache from localStorage
   */
  private clearStorageCache(): void {
    try {
      const storageKey = this.getStorageKey();
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      // Ignore errors when clearing
    }
  }

  // ==================== Configuration Caching (Local Evaluation Only) ====================

  /**
   * Get the localStorage key for configuration
   */
  private getConfigurationStorageKey(): string {
    const tokenHash = this.simpleHash(this.token);
    return `kitbase:flags:config:${tokenHash}`;
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfigurationFromStorage(): void {
    try {
      const storageKey = this.getConfigurationStorageKey();
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) {
        return;
      }

      const data = JSON.parse(stored) as {
        config: FlagConfiguration;
        timestamp: number;
      };

      // Check if the stored config is still valid (not expired)
      const age = Date.now() - data.timestamp;
      if (age > this.cacheTtl) {
        // Config expired, remove it
        window.localStorage.removeItem(storageKey);
        return;
      }

      // Restore configuration to evaluator
      if (this.evaluator && data.config) {
        this.evaluator.setConfiguration(data.config);
        // Mark as initialized since we have a cached config
        this.initialized = true;
      }
    } catch (error) {
      // If there's any error loading from storage, just continue without cache
      console.warn('[Kitbase] Failed to load configuration from localStorage:', error);
    }
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfigurationToStorage(config: FlagConfiguration): void {
    try {
      const storageKey = this.getConfigurationStorageKey();
      const data = {
        config,
        timestamp: Date.now(),
      };
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      // If storage is full or unavailable, just continue without saving
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Storage is full, try to clear old entries
        this.clearConfigurationStorage();
      }
    }
  }

  /**
   * Clear configuration from localStorage
   */
  private clearConfigurationStorage(): void {
    try {
      const storageKey = this.getConfigurationStorageKey();
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      // Ignore errors when clearing
    }
  }
}
