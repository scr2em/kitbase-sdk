import { v4 as uuidv4 } from 'uuid';
import type {
  KitbaseConfig,
  TrackOptions,
  TrackResponse,
  LogPayload,
  Storage,
} from './types.js';
import {
  ApiError,
  AuthenticationError,
  TimeoutError,
  ValidationError,
} from './errors.js';

const DEFAULT_BASE_URL = 'https://api.kitbase.dev';
const TIMEOUT = 30000;
const DEFAULT_STORAGE_KEY = 'kitbase_anonymous_id';

/**
 * In-memory storage fallback for non-browser environments
 */
class MemoryStorage implements Storage {
  private data: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

/**
 * Get the default storage (localStorage in browser, memory otherwise)
 */
function getDefaultStorage(): Storage {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return new MemoryStorage();
}

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
 * // Track anonymous events (anonymous_id is automatically included)
 * await kitbase.track({
 *   channel: 'payments',
 *   event: 'Page Viewed',
 *   icon: '👀',
 * });
 *
 * // Track events for a logged-in user (just pass user_id)
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
  private readonly baseUrl: string;
  private readonly storage: Storage | null;
  private readonly storageKey: string;
  private anonymousId: string | null = null;

  constructor(config: KitbaseConfig) {
    if (!config.token) {
      throw new ValidationError('API token is required', 'token');
    }

    this.token = config.token;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;

    // Initialize storage (null means disabled)
    if (config.storage === null) {
      this.storage = null;
    } else {
      this.storage = config.storage ?? getDefaultStorage();
    }

    // Load or generate anonymous ID
    this.initializeAnonymousId();
  }

  /**
   * Initialize the anonymous ID from storage or generate a new one
   */
  private initializeAnonymousId(): void {
    if (this.storage) {
      const stored = this.storage.getItem(this.storageKey);
      if (stored) {
        this.anonymousId = stored;
        return;
      }
    }

    // Generate new anonymous ID
    this.anonymousId = uuidv4();

    // Persist if storage is available
    if (this.storage && this.anonymousId) {
      this.storage.setItem(this.storageKey, this.anonymousId);
    }
  }

  /**
   * Get the current anonymous ID
   */
  getAnonymousId(): string | null {
    return this.anonymousId;
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

    // Include anonymous_id unless explicitly disabled
    const includeAnonymousId = options.includeAnonymousId !== false;

    const payload: LogPayload = {
      channel: options.channel,
      event: options.event,
      ...(options.user_id && { user_id: options.user_id }),
      ...(includeAnonymousId && this.anonymousId && { anonymous_id: this.anonymousId }),
      ...(options.icon && { icon: options.icon }),
      ...(options.notify !== undefined && { notify: options.notify }),
      ...(options.description && { description: options.description }),
      ...(options.tags && { tags: options.tags }),
    };

    return this.request<TrackResponse>('/v1/logs', payload);
  }

  private validateTrackOptions(options: TrackOptions): void {
    if (!options.event) {
      throw new ValidationError('Event is required', 'event');
    }
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
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
