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
 * Kitbase Feature Flags client for evaluating feature flags
 *
 * @example
 * ```typescript
 * import { FlagsClient } from '@kitbase/sdk/flags';
 *
 * const flags = new FlagsClient({
 *   token: '<YOUR_API_KEY>',
 * });
 *
 * // Simple boolean check
 * const isEnabled = await flags.getBooleanValue('dark-mode', false, {
 *   targetingKey: 'user-123',
 *   plan: 'premium',
 * });
 *
 * // Get full resolution details
 * const result = await flags.evaluateFlag('feature-x', {
 *   context: { targetingKey: 'user-123', country: 'US' }
 * });
 * console.log(result.value, result.reason);
 * ```
 */
export class FlagsClient {
  private readonly token: string;

  constructor(config: FlagsConfig) {
    if (!config.token) {
      throw new ValidationError('API token is required', 'token');
    }

    this.token = config.token;
  }

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
    const payload = this.buildSnapshotPayload(options?.context);
    return this.request<FlagSnapshot>('/v1/feature-flags/snapshot', payload);
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

    const payload = this.buildEvaluateFlagPayload(
      flagKey,
      options?.context,
      options?.defaultValue,
    );
    return this.request<EvaluatedFlag>('/v1/feature-flags/evaluate', payload);
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
    const url = `${BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
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
}
