/**
 * Local evaluation feature flag client
 *
 * Fetches flag configuration from the server and evaluates flags locally
 * without making API calls for each evaluation. Supports:
 * - Polling-based updates
 * - SSE streaming for real-time updates
 * - ETag-based cache validation
 * - Offline-first with initial config
 */

import type {
  FlagConfiguration,
  LocalFlagsConfig,
} from './config-types.js';
import type {
  EvaluationContext,
  EvaluatedFlag,
  FlagSnapshot,
  ResolutionDetails,
  JsonValue,
} from './types.js';
import { FlagEvaluator } from './evaluator.js';
import {
  ApiError,
  AuthenticationError,
  TimeoutError,
  TypeMismatchError,
  ValidationError,
} from './errors.js';

const BASE_URL = 'https://api.kitbase.dev';
const TIMEOUT = 30000;
const DEFAULT_POLLING_INTERVAL = 60000; // 1 minute

/**
 * Event types emitted by the LocalFlagsClient
 */
export type LocalFlagsEvent =
  | { type: 'ready'; config: FlagConfiguration }
  | { type: 'configurationChanged'; config: FlagConfiguration }
  | { type: 'error'; error: Error };

/**
 * Listener function for LocalFlagsClient events
 */
export type LocalFlagsListener = (event: LocalFlagsEvent) => void;

/**
 * Kitbase Feature Flags client with local evaluation
 *
 * This client fetches the flag configuration once and evaluates flags locally,
 * reducing latency and network usage. Configuration updates are handled via
 * polling or SSE streaming.
 *
 * @example
 * ```typescript
 * import { LocalFlagsClient } from '@kitbase/sdk/flags';
 *
 * const flags = new LocalFlagsClient({
 *   token: '<YOUR_API_KEY>',
 *   streaming: true, // Enable real-time updates
 * });
 *
 * // Wait for initial configuration
 * await flags.initialize();
 *
 * // Evaluate flags locally (no network call)
 * const isEnabled = flags.getBooleanValue('dark-mode', false, {
 *   targetingKey: 'user-123',
 *   plan: 'premium',
 * });
 *
 * // Clean up when done
 * flags.close();
 * ```
 */
export class LocalFlagsClient {
  private readonly token: string;
  private readonly streaming: boolean;
  private readonly pollingInterval: number;
  private readonly onConfigurationChange?: (config: FlagConfiguration) => void;
  private readonly onError?: (error: Error) => void;

  private evaluator: FlagEvaluator;
  private listeners: Set<LocalFlagsListener> = new Set();
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private eventSource: EventSource | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(config: LocalFlagsConfig) {
    if (!config.token) {
      throw new ValidationError('API token is required', 'token');
    }

    this.token = config.token;
    this.streaming = config.streaming ?? false;
    this.pollingInterval = config.pollingInterval ?? DEFAULT_POLLING_INTERVAL;
    this.onConfigurationChange = config.onConfigurationChange;
    this.onError = config.onError;
    this.evaluator = new FlagEvaluator();

    // Use initial config if provided
    if (config.initialConfig) {
      this.evaluator.setConfiguration(config.initialConfig);
    }
  }

  /**
   * Initialize the client by fetching the initial configuration
   *
   * @returns Promise that resolves when configuration is loaded
   * @throws {AuthenticationError} When the API key is invalid
   * @throws {ApiError} When the API returns an error
   * @throws {TimeoutError} When the request times out
   */
  async initialize(): Promise<void> {
    // Prevent multiple concurrent initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      await this.fetchConfiguration();
      this.initialized = true;

      // Start updates
      if (this.streaming) {
        this.startStreaming();
      } else if (this.pollingInterval > 0) {
        this.startPolling();
      }

      // Emit ready event
      const config = this.evaluator.getConfiguration();
      if (config) {
        this.emit({ type: 'ready', config });
      }
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Check if the client has been initialized
   */
  isReady(): boolean {
    return this.initialized && this.evaluator.isReady();
  }

  /**
   * Add an event listener
   */
  on(listener: LocalFlagsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove an event listener
   */
  off(listener: LocalFlagsListener): void {
    this.listeners.delete(listener);
  }

  private emit(event: LocalFlagsEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }

  /**
   * Close the client and stop all updates
   */
  close(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.listeners.clear();
  }

  /**
   * Manually refresh the configuration
   *
   * @returns Promise that resolves when configuration is updated
   */
  async refresh(): Promise<void> {
    await this.fetchConfiguration();
  }

  /**
   * Get the current configuration
   */
  getConfiguration(): FlagConfiguration | null {
    return this.evaluator.getConfiguration();
  }

  // ==================== Flag Evaluation Methods ====================

  /**
   * Get a snapshot of all evaluated feature flags
   *
   * @param context - Optional evaluation context
   * @returns Flag snapshot with all evaluated flags
   */
  getSnapshot(context?: EvaluationContext): FlagSnapshot {
    this.ensureReady();

    const config = this.evaluator.getConfiguration()!;
    const flags = this.evaluator.evaluateAll(context);

    return {
      projectId: '', // Not available in local config
      environmentId: config.environmentId,
      evaluatedAt: new Date().toISOString(),
      flags,
    };
  }

  /**
   * Evaluate a single feature flag with full resolution details
   *
   * @param flagKey - The key of the flag to evaluate
   * @param context - Optional evaluation context
   * @returns Evaluated flag with resolution details
   */
  evaluateFlag(
    flagKey: string,
    context?: EvaluationContext,
  ): EvaluatedFlag {
    this.ensureReady();

    if (!flagKey) {
      throw new ValidationError('Flag key is required', 'flagKey');
    }

    return this.evaluator.evaluate(flagKey, context);
  }

  /**
   * Get a boolean flag value
   *
   * @param flagKey - The key of the flag to evaluate
   * @param defaultValue - Default value if flag cannot be evaluated
   * @param context - Optional evaluation context
   * @returns The boolean value
   * @throws {TypeMismatchError} When the flag is not a boolean type
   */
  getBooleanValue(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
  ): boolean {
    const result = this.getBooleanDetails(flagKey, defaultValue, context);
    return result.value;
  }

  /**
   * Get a boolean flag value with full resolution details
   */
  getBooleanDetails(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
  ): ResolutionDetails<boolean> {
    const flag = this.evaluateFlag(flagKey, context);
    return this.toResolutionDetails(flag, defaultValue, 'boolean');
  }

  /**
   * Get a string flag value
   *
   * @param flagKey - The key of the flag to evaluate
   * @param defaultValue - Default value if flag cannot be evaluated
   * @param context - Optional evaluation context
   * @returns The string value
   * @throws {TypeMismatchError} When the flag is not a string type
   */
  getStringValue(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
  ): string {
    const result = this.getStringDetails(flagKey, defaultValue, context);
    return result.value;
  }

  /**
   * Get a string flag value with full resolution details
   */
  getStringDetails(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
  ): ResolutionDetails<string> {
    const flag = this.evaluateFlag(flagKey, context);
    return this.toResolutionDetails(flag, defaultValue, 'string');
  }

  /**
   * Get a number flag value
   *
   * @param flagKey - The key of the flag to evaluate
   * @param defaultValue - Default value if flag cannot be evaluated
   * @param context - Optional evaluation context
   * @returns The number value
   * @throws {TypeMismatchError} When the flag is not a number type
   */
  getNumberValue(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
  ): number {
    const result = this.getNumberDetails(flagKey, defaultValue, context);
    return result.value;
  }

  /**
   * Get a number flag value with full resolution details
   */
  getNumberDetails(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
  ): ResolutionDetails<number> {
    const flag = this.evaluateFlag(flagKey, context);
    return this.toResolutionDetails(flag, defaultValue, 'number');
  }

  /**
   * Get a JSON object flag value
   *
   * @param flagKey - The key of the flag to evaluate
   * @param defaultValue - Default value if flag cannot be evaluated
   * @param context - Optional evaluation context
   * @returns The JSON value
   * @throws {TypeMismatchError} When the flag is not a json type
   */
  getJsonValue<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
  ): T {
    const result = this.getJsonDetails(flagKey, defaultValue, context);
    return result.value;
  }

  /**
   * Get a JSON object flag value with full resolution details
   */
  getJsonDetails<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
  ): ResolutionDetails<T> {
    const flag = this.evaluateFlag(flagKey, context);
    return this.toResolutionDetails(flag, defaultValue, 'json');
  }

  /**
   * Check if a flag exists in the configuration
   */
  hasFlag(flagKey: string): boolean {
    return this.evaluator.hasFlag(flagKey);
  }

  /**
   * Get all flag keys in the configuration
   */
  getFlagKeys(): string[] {
    return this.evaluator.getFlagKeys();
  }

  // ==================== Private Methods ====================

  private ensureReady(): void {
    if (!this.evaluator.isReady()) {
      throw new ValidationError(
        'Client not initialized. Call initialize() first.',
        'client',
      );
    }
  }

  private toResolutionDetails<T>(
    flag: EvaluatedFlag,
    defaultValue: T,
    expectedType: 'boolean' | 'string' | 'number' | 'json',
  ): ResolutionDetails<T> {
    // Check for errors
    if (flag.errorCode === 'FLAG_NOT_FOUND') {
      return {
        value: defaultValue,
        reason: 'ERROR',
        errorCode: 'FLAG_NOT_FOUND',
        errorMessage: flag.errorMessage,
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
      };
    }

    return {
      value: flag.value as T,
      variant: flag.variant,
      reason: flag.reason,
      errorCode: flag.errorCode,
      errorMessage: flag.errorMessage,
    };
  }

  private async fetchConfiguration(): Promise<void> {
    const url = `${BASE_URL}/v1/feature-flags/config`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const headers: Record<string, string> = {
        'X-API-Key': this.token,
      };

      // Add ETag for cache validation
      const currentETag = this.evaluator.getETag();
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
    const previousConfig = this.evaluator.getConfiguration();
    this.evaluator.setConfiguration(config);

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

  private startStreaming(): void {
    // SSE requires browser environment with EventSource
    if (typeof EventSource === 'undefined') {
      console.warn(
        'EventSource not available. Falling back to polling.',
      );
      this.startPolling();
      return;
    }

    const url = `${BASE_URL}/v1/feature-flags/config/stream`;

    // Create custom EventSource with headers
    // Note: Standard EventSource doesn't support custom headers
    // We'll use a workaround by including the token as a query parameter
    // Or fall back to polling in environments where custom headers are needed
    this.eventSource = new EventSource(`${url}?token=${encodeURIComponent(this.token)}`);

    this.eventSource.onopen = () => {
      // Connected successfully
    };

    this.eventSource.addEventListener('config', (event) => {
      try {
        const config = JSON.parse(event.data) as FlagConfiguration;
        this.updateConfiguration(config);
      } catch (error) {
        this.handleError(error);
      }
    });

    this.eventSource.addEventListener('heartbeat', () => {
      // Keep-alive, nothing to do
    });

    this.eventSource.onerror = () => {
      // EventSource will automatically try to reconnect
      this.handleError(new Error('SSE connection error'));
    };
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
}
