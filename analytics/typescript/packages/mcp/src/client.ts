import { McpConfig } from './config.js';

export class KitbaseApiClient {
  constructor(private config: McpConfig) {}

  async request<T = unknown>(
    path: string,
    options: {
      method?: 'GET' | 'POST';
      params?: Record<string, string | number | boolean | undefined>;
      body?: unknown;
    } = {},
  ): Promise<T> {
    const { method = 'GET', params, body } = options;

    // Build URL — path can use {projectId} placeholder
    const resolvedPath = path.replace('{projectId}', this.config.projectId);
    const url = new URL(resolvedPath, this.config.apiUrl);

    // Add query params (skip undefined)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    // Add environment filter if configured
    if (this.config.environmentId) {
      url.searchParams.set('environmentId', this.config.environmentId);
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'X-API-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new ApiError(method, url.toString(), response.status, text || response.statusText);
    }

    return response.json() as Promise<T>;
  }
}

export class ApiError extends Error {
  constructor(
    public method: string,
    public url: string,
    public status: number,
    public body: string,
  ) {
    super(`API error (${status}): ${method} ${url} — ${body}`);
    this.name = 'ApiError';
  }
}
