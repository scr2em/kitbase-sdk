import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadEnv, resolveConfig } from '../config.js';

describe('loadEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('defaults KITBASE_API_URL to https://api.kitbase.dev', () => {
    process.env.KITBASE_API_KEY = 'sk_kitbase_test123';

    const env = loadEnv();
    expect(env.apiUrl).toBe('https://api.kitbase.dev');
  });

  it('throws when KITBASE_API_KEY is missing', () => {
    expect(() => loadEnv()).toThrow('KITBASE_API_KEY environment variable is required');
  });

  it('throws when API key does not start with sk_kitbase_', () => {
    process.env.KITBASE_API_KEY = 'pk_kitbase_test123';

    expect(() => loadEnv()).toThrow('KITBASE_API_KEY must be a private API key starting with sk_kitbase_');
  });

  it('strips trailing slash from API URL', () => {
    process.env.KITBASE_API_URL = 'https://api.kitbase.io///';
    process.env.KITBASE_API_KEY = 'sk_kitbase_test123';

    const env = loadEnv();
    expect(env.apiUrl).toBe('https://api.kitbase.io');
  });

  it('returns correct env when all vars present', () => {
    process.env.KITBASE_API_URL = 'https://api.kitbase.io';
    process.env.KITBASE_API_KEY = 'sk_kitbase_test123';

    const env = loadEnv();
    expect(env).toEqual({
      apiUrl: 'https://api.kitbase.io',
      apiKey: 'sk_kitbase_test123',
    });
  });
});

describe('resolveConfig', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const env = {
    apiUrl: 'https://api.kitbase.io',
    apiKey: 'sk_kitbase_test123',
  };

  it('calls /api/v1/auth/key-info with correct headers', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projectId: 'proj_abc', environmentId: 'env_prod' }),
    });

    await resolveConfig(env);

    expect(fetchSpy).toHaveBeenCalledWith('https://api.kitbase.io/api/v1/auth/key-info', {
      headers: {
        'X-API-Key': 'sk_kitbase_test123',
        'Content-Type': 'application/json',
      },
    });
  });

  it('returns config with resolved projectId and environmentId', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projectId: 'proj_abc', environmentId: 'env_prod' }),
    });

    const config = await resolveConfig(env);
    expect(config).toEqual({
      apiUrl: 'https://api.kitbase.io',
      apiKey: 'sk_kitbase_test123',
      projectId: 'proj_abc',
      environmentId: 'env_prod',
    });
  });

  it('sets environmentId to undefined when empty string', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projectId: 'proj_abc', environmentId: '' }),
    });

    const config = await resolveConfig(env);
    expect(config.environmentId).toBeUndefined();
  });

  it('throws on 401 with friendly message', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    await expect(resolveConfig(env)).rejects.toThrow('Invalid or expired API key');
  });

  it('throws on other errors with status code', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve(''),
    });

    await expect(resolveConfig(env)).rejects.toThrow('Failed to resolve API key info (500)');
  });
});
