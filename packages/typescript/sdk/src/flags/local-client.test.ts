import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocalFlagsClient } from './local-client.js';
import type { FlagConfiguration } from './config-types.js';
import {
  ValidationError,
  AuthenticationError,
  ApiError,
  TimeoutError,
  TypeMismatchError,
} from './errors.js';

describe('LocalFlagsClient', () => {
  const mockFetch = vi.fn();

  const createMockConfig = (): FlagConfiguration => ({
    environmentId: 'env-123',
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    etag: '"abc123"',
    flags: [
      {
        key: 'dark-mode',
        valueType: 'boolean',
        defaultEnabled: true,
        defaultValue: true,
        rules: [],
      },
      {
        key: 'api-url',
        valueType: 'string',
        defaultEnabled: true,
        defaultValue: 'https://api.example.com',
        rules: [],
      },
      {
        key: 'max-items',
        valueType: 'number',
        defaultEnabled: true,
        defaultValue: 100,
        rules: [],
      },
      {
        key: 'ui-config',
        valueType: 'json',
        defaultEnabled: true,
        defaultValue: { theme: 'dark' },
        rules: [],
      },
      {
        key: 'premium-feature',
        valueType: 'boolean',
        defaultEnabled: false,
        defaultValue: false,
        rules: [
          {
            priority: 0,
            segmentKey: 'premium-users',
            enabled: true,
            value: true,
          },
        ],
      },
      {
        key: 'disabled-flag',
        valueType: 'boolean',
        defaultEnabled: false,
        defaultValue: true,
        rules: [],
      },
    ],
    segments: [
      {
        key: 'premium-users',
        name: 'Premium Users',
        rules: [{ field: 'plan', operator: 'eq', value: 'premium' }],
      },
    ],
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should throw ValidationError when token is missing', () => {
      expect(() => new LocalFlagsClient({ token: '' })).toThrow(ValidationError);
      expect(() => new LocalFlagsClient({ token: '' })).toThrow(
        'API token is required',
      );
    });

    it('should create client with valid config', () => {
      const client = new LocalFlagsClient({ token: 'test-token' });
      expect(client).toBeInstanceOf(LocalFlagsClient);
    });

    it('should use initial config if provided', () => {
      const config = createMockConfig();
      const client = new LocalFlagsClient({
        token: 'test-token',
        initialConfig: config,
      });

      // Client should be ready if initial config was used
      expect(client.getConfiguration()).toEqual(config);
    });
  });

  describe('initialize', () => {
    it('should fetch configuration on initialize', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.kitbase.dev/v1/feature-flags/config',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-API-Key': 'test-token',
          }),
        }),
      );
      expect(client.isReady()).toBe(true);

      client.close();
    });

    it('should emit ready event after initialization', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      const listener = vi.fn();
      client.on(listener);

      await client.initialize();

      expect(listener).toHaveBeenCalledWith({
        type: 'ready',
        config: mockConfig,
      });

      client.close();
    });

    it('should throw AuthenticationError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid API key' }),
      });

      const client = new LocalFlagsClient({ token: 'invalid-token', pollingInterval: 0 });
      await expect(client.initialize()).rejects.toThrow(AuthenticationError);

      client.close();
    });

    it('should throw ApiError on other HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await expect(client.initialize()).rejects.toThrow(ApiError);

      client.close();
    });
  });

  describe('isReady', () => {
    it('should return false before initialization', () => {
      const client = new LocalFlagsClient({ token: 'test-token' });
      expect(client.isReady()).toBe(false);
      client.close();
    });

    it('should return true after initialization', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      expect(client.isReady()).toBe(true);

      client.close();
    });
  });

  describe('evaluateFlag', () => {
    it('should throw error if not initialized', () => {
      const client = new LocalFlagsClient({ token: 'test-token' });
      expect(() => client.evaluateFlag('dark-mode')).toThrow(ValidationError);
      expect(() => client.evaluateFlag('dark-mode')).toThrow(
        'Client not initialized',
      );
      client.close();
    });

    it('should evaluate flag locally', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      const result = client.evaluateFlag('dark-mode');

      expect(result.flagKey).toBe('dark-mode');
      expect(result.enabled).toBe(true);
      expect(result.value).toBe(true);
      expect(result.valueType).toBe('boolean');

      client.close();
    });

    it('should return FLAG_NOT_FOUND for unknown flag', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      const result = client.evaluateFlag('unknown-flag');

      expect(result.reason).toBe('ERROR');
      expect(result.errorCode).toBe('FLAG_NOT_FOUND');

      client.close();
    });
  });

  describe('getBooleanValue', () => {
    it('should return boolean value', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      const result = client.getBooleanValue('dark-mode', false);
      expect(result).toBe(true);

      client.close();
    });

    it('should return default value when flag is disabled', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      const result = client.getBooleanValue('disabled-flag', true);
      expect(result).toBe(true);

      client.close();
    });

    it('should throw TypeMismatchError for wrong type', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      expect(() => client.getBooleanValue('api-url', false)).toThrow(
        TypeMismatchError,
      );

      client.close();
    });
  });

  describe('getStringValue', () => {
    it('should return string value', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      const result = client.getStringValue('api-url', 'default');
      expect(result).toBe('https://api.example.com');

      client.close();
    });
  });

  describe('getNumberValue', () => {
    it('should return number value', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      const result = client.getNumberValue('max-items', 50);
      expect(result).toBe(100);

      client.close();
    });
  });

  describe('getJsonValue', () => {
    it('should return JSON value', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      const result = client.getJsonValue('ui-config', {});
      expect(result).toEqual({ theme: 'dark' });

      client.close();
    });
  });

  describe('segment targeting', () => {
    it('should match segment rules', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      // Premium user should get true
      const premiumResult = client.getBooleanValue('premium-feature', false, {
        targetingKey: 'user-1',
        plan: 'premium',
      });
      expect(premiumResult).toBe(true);

      // Free user should get default (false)
      const freeResult = client.getBooleanValue('premium-feature', false, {
        targetingKey: 'user-2',
        plan: 'free',
      });
      expect(freeResult).toBe(false);

      client.close();
    });
  });

  describe('getSnapshot', () => {
    it('should return all evaluated flags', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      const snapshot = client.getSnapshot();

      expect(snapshot.environmentId).toBe('env-123');
      expect(snapshot.flags).toHaveLength(6);
      expect(snapshot.flags.map((f) => f.flagKey).sort()).toEqual([
        'api-url',
        'dark-mode',
        'disabled-flag',
        'max-items',
        'premium-feature',
        'ui-config',
      ]);

      client.close();
    });
  });

  describe('polling', () => {
    it('should poll for updates at configured interval', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({
        token: 'test-token',
        pollingInterval: 5000,
      });
      await client.initialize();

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance timer to trigger polling
      await vi.advanceTimersByTimeAsync(5000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(5000);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      client.close();
    });

    it('should send ETag header for cache validation', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({
        token: 'test-token',
        pollingInterval: 5000,
      });
      await client.initialize();

      // First call shouldn't have ETag
      expect(mockFetch.mock.calls[0][1].headers['If-None-Match']).toBeUndefined();

      // Advance timer to trigger polling
      await vi.advanceTimersByTimeAsync(5000);

      // Second call should have ETag
      expect(mockFetch.mock.calls[1][1].headers['If-None-Match']).toBe('"abc123"');

      client.close();
    });

    it('should handle 304 Not Modified response', async () => {
      const mockConfig = createMockConfig();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 304,
        });

      const client = new LocalFlagsClient({
        token: 'test-token',
        pollingInterval: 5000,
      });
      await client.initialize();

      const configBeforePoll = client.getConfiguration();

      // Advance timer to trigger polling
      await vi.advanceTimersByTimeAsync(5000);

      // Config should be unchanged
      expect(client.getConfiguration()).toEqual(configBeforePoll);

      client.close();
    });
  });

  describe('configuration change events', () => {
    it('should emit configurationChanged event when config updates', async () => {
      const mockConfig1 = createMockConfig();
      const mockConfig2 = { ...createMockConfig(), etag: '"def456"' };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig1,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig2,
        });

      const listener = vi.fn();
      const client = new LocalFlagsClient({
        token: 'test-token',
        pollingInterval: 5000,
      });
      client.on(listener);

      await client.initialize();

      // First event is 'ready'
      expect(listener).toHaveBeenCalledWith({
        type: 'ready',
        config: mockConfig1,
      });

      // Advance timer to trigger polling
      await vi.advanceTimersByTimeAsync(5000);

      // Second event should be 'configurationChanged'
      expect(listener).toHaveBeenCalledWith({
        type: 'configurationChanged',
        config: mockConfig2,
      });

      client.close();
    });

    it('should call onConfigurationChange callback', async () => {
      const mockConfig1 = createMockConfig();
      const mockConfig2 = { ...createMockConfig(), etag: '"def456"' };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig1,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig2,
        });

      const onConfigurationChange = vi.fn();
      const client = new LocalFlagsClient({
        token: 'test-token',
        pollingInterval: 5000,
        onConfigurationChange,
      });

      await client.initialize();

      // Advance timer to trigger polling
      await vi.advanceTimersByTimeAsync(5000);

      expect(onConfigurationChange).toHaveBeenCalledWith(mockConfig2);

      client.close();
    });
  });

  describe('close', () => {
    it('should stop polling when closed', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({
        token: 'test-token',
        pollingInterval: 5000,
      });
      await client.initialize();

      expect(mockFetch).toHaveBeenCalledTimes(1);

      client.close();

      // Advance timer - polling should not happen
      await vi.advanceTimersByTimeAsync(10000);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasFlag / getFlagKeys', () => {
    it('should return flag keys', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      const keys = client.getFlagKeys();
      expect(keys.sort()).toEqual([
        'api-url',
        'dark-mode',
        'disabled-flag',
        'max-items',
        'premium-feature',
        'ui-config',
      ]);

      client.close();
    });

    it('should check if flag exists', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new LocalFlagsClient({ token: 'test-token', pollingInterval: 0 });
      await client.initialize();

      expect(client.hasFlag('dark-mode')).toBe(true);
      expect(client.hasFlag('unknown-flag')).toBe(false);

      client.close();
    });
  });
});
