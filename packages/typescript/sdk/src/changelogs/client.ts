import type { ChangelogsConfig, ChangelogResponse } from './types.js';
import {
  ApiError,
  AuthenticationError,
  NotFoundError,
  TimeoutError,
  ValidationError,
} from './errors.js';

const BASE_URL = 'https://api.kitbase.dev';
const TIMEOUT = 30000;

/**
 * Changelogs client for fetching version changelogs
 *
 * @example
 * ```typescript
 * import { Changelogs } from '@kitbase/sdk/changelogs';
 *
 * const changelogs = new Changelogs({
 *   token: '<YOUR_API_KEY>',
 * });
 *
 * const changelog = await changelogs.get('1.0.0');
 * console.log(changelog.title);
 * console.log(changelog.entries);
 * ```
 */
export class Changelogs {
  private readonly token: string;

  constructor(config: ChangelogsConfig) {
    if (!config.token) {
      throw new ValidationError('API token is required', 'token');
    }

    this.token = config.token;
  }

  /**
   * Get a changelog by version
   *
   * @param version - Version string (e.g., "1.0.0", "2.3.1")
   * @returns Promise resolving to the changelog
   * @throws {ValidationError} When version is missing
   * @throws {AuthenticationError} When the API key is invalid
   * @throws {NotFoundError} When the changelog is not found
   * @throws {ApiError} When the API returns an error
   * @throws {TimeoutError} When the request times out
   */
  async get(version: string): Promise<ChangelogResponse> {
    if (!version) {
      throw new ValidationError('Version is required', 'version');
    }

    return this.request<ChangelogResponse>(
      `/v1/changelogs/${encodeURIComponent(version)}`,
    );
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await this.parseResponseBody(response);

        if (response.status === 401) {
          throw new AuthenticationError();
        }

        if (response.status === 404) {
          throw new NotFoundError(endpoint.split('/').pop() ?? '');
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







