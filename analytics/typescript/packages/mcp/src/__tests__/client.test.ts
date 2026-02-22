import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KitbaseApiClient, ApiError } from '../client.js';
import { McpConfig } from '../config.js';

describe('KitbaseApiClient', () => {
  const baseConfig: McpConfig = {
    apiUrl: 'https://api.kitbase.io',
    apiKey: 'sk_kitbase_test123',
    projectId: 'proj_abc',
  };

  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  it('constructs correct URL with projectId replacement', async () => {
    const client = new KitbaseApiClient(baseConfig);
    await client.request('/projects/{projectId}/events/');

    const calledUrl = fetchSpy.mock.calls[0][0];
    expect(calledUrl).toContain('/projects/proj_abc/events/');
  });

  it('sends X-API-Key header', async () => {
    const client = new KitbaseApiClient(baseConfig);
    await client.request('/test');

    const calledOptions = fetchSpy.mock.calls[0][1];
    expect(calledOptions.headers['X-API-Key']).toBe('sk_kitbase_test123');
  });

  it('sends Content-Type header', async () => {
    const client = new KitbaseApiClient(baseConfig);
    await client.request('/test');

    const calledOptions = fetchSpy.mock.calls[0][1];
    expect(calledOptions.headers['Content-Type']).toBe('application/json');
  });

  it('adds query params and skips undefined values', async () => {
    const client = new KitbaseApiClient(baseConfig);
    await client.request('/test', {
      params: { foo: 'bar', baz: undefined, num: 42 },
    });

    const calledUrl = fetchSpy.mock.calls[0][0];
    expect(calledUrl).toContain('foo=bar');
    expect(calledUrl).toContain('num=42');
    expect(calledUrl).not.toContain('baz');
  });

  it('adds environmentId if configured', async () => {
    const client = new KitbaseApiClient({
      ...baseConfig,
      environmentId: 'env_prod',
    });
    await client.request('/test');

    const calledUrl = fetchSpy.mock.calls[0][0];
    expect(calledUrl).toContain('environmentId=env_prod');
  });

  it('does not add environmentId if not configured', async () => {
    const client = new KitbaseApiClient(baseConfig);
    await client.request('/test');

    const calledUrl = fetchSpy.mock.calls[0][0];
    expect(calledUrl).not.toContain('environmentId');
  });

  it('defaults to GET method', async () => {
    const client = new KitbaseApiClient(baseConfig);
    await client.request('/test');

    const calledOptions = fetchSpy.mock.calls[0][1];
    expect(calledOptions.method).toBe('GET');
  });

  it('handles POST requests with body', async () => {
    const client = new KitbaseApiClient(baseConfig);
    const body = { steps: [{ eventName: 'click' }] };
    await client.request('/test', { method: 'POST', body });

    const calledOptions = fetchSpy.mock.calls[0][1];
    expect(calledOptions.method).toBe('POST');
    expect(calledOptions.body).toBe(JSON.stringify(body));
  });

  it('does not include body for GET requests', async () => {
    const client = new KitbaseApiClient(baseConfig);
    await client.request('/test');

    const calledOptions = fetchSpy.mock.calls[0][1];
    expect(calledOptions.body).toBeUndefined();
  });

  it('throws ApiError on non-ok responses', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve('Resource not found'),
    });

    const client = new KitbaseApiClient(baseConfig);

    await expect(
      client.request('/test').catch((e) => {
        expect(e).toBeInstanceOf(ApiError);
        expect(e.status).toBe(404);
        expect(e.method).toBe('GET');
        expect(e.url).toContain('/test');
        expect(e.body).toBe('Resource not found');
        throw e;
      }),
    ).rejects.toThrow(ApiError);
  });

  it('uses statusText when response body is empty', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve(''),
    });

    const client = new KitbaseApiClient(baseConfig);

    try {
      await client.request('/test');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).body).toBe('Internal Server Error');
    }
  });

  it('returns parsed JSON on success', async () => {
    const client = new KitbaseApiClient(baseConfig);
    const result = await client.request('/test');

    expect(result).toEqual({ data: 'test' });
  });
});
