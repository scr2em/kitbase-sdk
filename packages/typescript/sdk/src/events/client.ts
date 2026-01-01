import type {
  KitbaseConfig,
  TrackOptions,
  TrackResponse,
  LogPayload,
} from './types.js';
import {
  ApiError,
  AuthenticationError,
  TimeoutError,
  ValidationError,
} from './errors.js';

const BASE_URL = 'https://api.kitbase.dev';
const TIMEOUT = 30000;

/**
 * Kitbase client for tracking events
 *
 * @example
 * ```typescript
 * import { Kitbase } from '@kitbase/sdk/events';
 *
 * const kitbase = new Kitbase({
 *   token: '<YOUR_API_KEY>',
 * });
 *
 * await kitbase.track({
 *   channel: 'payments',
 *   event: 'New Subscription',
 *   user_id: 'user-123',
 *   icon: '💰',
 *   notify: true,
 *   tags: {
 *     plan: 'premium',
 *     cycle: 'monthly',
 *   },
 * });
 * ```
 */
export class Kitbase {
  private readonly token: string;

  constructor(config: KitbaseConfig) {
    if (!config.token) {
      throw new ValidationError('API token is required', 'token');
    }

    this.token = config.token;
  }

  /**
   * Track an event
   *
   * @param options - Event tracking options
   * @returns Promise resolving to the track response
   * @throws {ValidationError} When required fields are missing
   * @throws {AuthenticationError} When the API key is invalid
   * @throws {ApiError} When the API returns an error
   * @throws {TimeoutError} When the request times out
   */
  async track(options: TrackOptions): Promise<TrackResponse> {
    this.validateTrackOptions(options);

    const payload: LogPayload = {
      channel: options.channel,
      event: options.event,
      ...(options.user_id && { user_id: options.user_id }),
      ...(options.icon && { icon: options.icon }),
      ...(options.notify !== undefined && { notify: options.notify }),
      ...(options.description && { description: options.description }),
      ...(options.tags && { tags: options.tags }),
    };

    return this.request<TrackResponse>('/v1/logs', payload);
  }

  private validateTrackOptions(options: TrackOptions): void {
    if (!options.channel) {
      throw new ValidationError('Channel is required', 'channel');
    }
    if (!options.event) {
      throw new ValidationError('Event is required', 'event');
    }
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
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
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
}

