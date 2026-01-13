import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FlagsClient } from './client.js';
import type { FlagConfiguration } from './config-types.js';
import {
  ValidationError,
  AuthenticationError,
  ApiError,
  TimeoutError,
  TypeMismatchError,
} from './errors.js';

describe('FlagsClient', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should throw ValidationError when token is missing', () => {
      expect(() => new FlagsClient({ token: '' })).toThrow(ValidationError);
      expect(() => new FlagsClient({ token: '' })).toThrow(
        'API token is required',
      );
    });

    it('should create client with valid config', () => {
      const client = new FlagsClient({ token: 'test-token' });
      expect(client).toBeInstanceOf(FlagsClient);
    });
  });

  // ==================== Remote Evaluation Mode ====================

  describe('Remote Evaluation Mode', () => {
    describe('getSnapshot', () => {
      it('should successfully get flag snapshot', async () => {
        const mockResponse = {
          projectId: 'proj-123',
          environmentId: 'env-456',
          evaluatedAt: '2024-01-15T10:30:00Z',
          flags: [
            {
              flagKey: 'dark-mode',
              enabled: true,
              valueType: 'boolean',
              value: true,
              reason: 'STATIC',
            },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const client = new FlagsClient({ token: 'test-token' });
        const result = await client.getSnapshot();

        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.kitbase.dev/v1/feature-flags/snapshot',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': 'test-token',
            },
          }),
        );
      });

      it('should send context with snapshot request', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            projectId: 'proj-123',
            environmentId: 'env-456',
            evaluatedAt: '2024-01-15T10:30:00Z',
            flags: [],
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        await client.getSnapshot({
          context: {
            targetingKey: 'user-123',
            plan: 'premium',
            country: 'US',
          },
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body).toEqual({
          identityId: 'user-123',
          context: {
            plan: 'premium',
            country: 'US',
          },
        });
      });
    });

    describe('evaluateFlag', () => {
      it('should throw ValidationError when flagKey is missing', async () => {
        const client = new FlagsClient({ token: 'test-token' });
        await expect(client.evaluateFlag('')).rejects.toThrow(ValidationError);
        await expect(client.evaluateFlag('')).rejects.toThrow(
          'Flag key is required',
        );
      });

      it('should successfully evaluate a flag', async () => {
        const mockResponse = {
          flagKey: 'dark-mode',
          enabled: true,
          valueType: 'boolean',
          value: true,
          variant: 'default-enabled',
          reason: 'STATIC',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const client = new FlagsClient({ token: 'test-token' });
        const result = await client.evaluateFlag('dark-mode');

        expect(result).toEqual(mockResponse);
        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.flagKey).toBe('dark-mode');
      });

      it('should send context and defaultValue', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'feature-x',
            enabled: true,
            valueType: 'boolean',
            value: true,
            reason: 'TARGETING_MATCH',
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        await client.evaluateFlag('feature-x', {
          context: { targetingKey: 'user-123', plan: 'premium' },
          defaultValue: false,
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body).toEqual({
          flagKey: 'feature-x',
          identityId: 'user-123',
          context: { plan: 'premium' },
          defaultValue: false,
        });
      });
    });

    describe('getBooleanValue', () => {
      it('should return boolean value', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'dark-mode',
            enabled: true,
            valueType: 'boolean',
            value: true,
            reason: 'STATIC',
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        const result = await client.getBooleanValue('dark-mode', false);

        expect(result).toBe(true);
      });

      it('should return default value when flag is disabled', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'dark-mode',
            enabled: false,
            valueType: 'boolean',
            value: null,
            reason: 'DISABLED',
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        const result = await client.getBooleanValue('dark-mode', true);

        expect(result).toBe(true);
      });

      it('should throw TypeMismatchError for wrong type', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'api-url',
            enabled: true,
            valueType: 'string',
            value: 'https://api.example.com',
            reason: 'STATIC',
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        await expect(client.getBooleanValue('api-url', false)).rejects.toThrow(
          TypeMismatchError,
        );
      });
    });

    describe('getStringValue', () => {
      it('should return string value', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'api-url',
            enabled: true,
            valueType: 'string',
            value: 'https://api.example.com',
            reason: 'STATIC',
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        const result = await client.getStringValue('api-url', 'default');

        expect(result).toBe('https://api.example.com');
      });
    });

    describe('getNumberValue', () => {
      it('should return number value', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'max-items',
            enabled: true,
            valueType: 'number',
            value: 100,
            reason: 'STATIC',
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        const result = await client.getNumberValue('max-items', 50);

        expect(result).toBe(100);
      });
    });

    describe('getJsonValue', () => {
      it('should return JSON value', async () => {
        const jsonValue = { theme: 'dark', fontSize: 14 };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'ui-config',
            enabled: true,
            valueType: 'json',
            value: jsonValue,
            reason: 'STATIC',
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        const result = await client.getJsonValue('ui-config', {});

        expect(result).toEqual(jsonValue);
      });
    });

    describe('getBooleanDetails', () => {
      it('should return full resolution details', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'feature-x',
            enabled: true,
            valueType: 'boolean',
            value: true,
            variant: 'segment-abc123',
            reason: 'TARGETING_MATCH',
            flagMetadata: { name: 'Feature X' },
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        const result = await client.getBooleanDetails('feature-x', false, {
          targetingKey: 'user-123',
        });

        expect(result).toEqual({
          value: true,
          variant: 'segment-abc123',
          reason: 'TARGETING_MATCH',
          errorCode: undefined,
          errorMessage: undefined,
          flagMetadata: { name: 'Feature X' },
        });
      });

      it('should return default value with error details for FLAG_NOT_FOUND', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'unknown-flag',
            enabled: false,
            valueType: 'boolean',
            value: false,
            reason: 'ERROR',
            errorCode: 'FLAG_NOT_FOUND',
            errorMessage: "Flag 'unknown-flag' not found",
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        const result = await client.getBooleanDetails('unknown-flag', true);

        expect(result.value).toBe(true);
        expect(result.reason).toBe('ERROR');
        expect(result.errorCode).toBe('FLAG_NOT_FOUND');
      });
    });

    describe('error handling', () => {
      it('should throw AuthenticationError on 401', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ message: 'Invalid API key' }),
        });

        const client = new FlagsClient({ token: 'invalid-token' });
        await expect(client.getSnapshot()).rejects.toThrow(AuthenticationError);
      });

      it('should throw ApiError on other HTTP errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ message: 'Invalid request' }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        await expect(client.getSnapshot()).rejects.toThrow(ApiError);
      });

      it('should throw TimeoutError when request times out', async () => {
        mockFetch.mockImplementationOnce(
          () =>
            new Promise((_, reject) => {
              const error = new Error('Aborted');
              error.name = 'AbortError';
              reject(error);
            }),
        );

        const client = new FlagsClient({ token: 'test-token' });
        await expect(client.getSnapshot()).rejects.toThrow(TimeoutError);
      });
    });
  });

  // ==================== Local Evaluation Mode ====================

  describe('Local Evaluation Mode', () => {
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
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('initialize', () => {
      it('should fetch configuration on initialize', async () => {
        const mockConfig = createMockConfig();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig,
        });

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });
        await client.waitUntilReady();

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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });
        const listener = vi.fn();
        client.on(listener);
        await client.waitUntilReady();

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

        const client = new FlagsClient({
          token: 'invalid-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });
        await expect(client.initialize()).rejects.toThrow(AuthenticationError);

        client.close();
      });

      it('should be no-op for remote evaluation mode', async () => {
        const client = new FlagsClient({ token: 'test-token' });
        // Should not throw
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    describe('isReady', () => {
      it('should return true for remote evaluation mode', () => {
        const client = new FlagsClient({ token: 'test-token' });
        expect(client.isReady()).toBe(true);
      });

      it('should return false before initialization for local mode', () => {
        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
        });
        expect(client.isReady()).toBe(false);
        client.close();
      });

      it('should return true after initialization for local mode', async () => {
        const mockConfig = createMockConfig();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig,
        });

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });
        await client.waitUntilReady();

        expect(client.isReady()).toBe(true);

        client.close();
      });
    });

    describe('evaluateFlag (local)', () => {
      it('should auto-initialize on first evaluation', async () => {
        const mockConfig = createMockConfig();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig,
        });

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
        });

        // First evaluation should auto-initialize
        const result = await client.evaluateFlag('dark-mode');
        expect(result.flagKey).toBe('dark-mode');
        expect(result.enabled).toBe(true);

        // Should have made the config request
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.kitbase.dev/v1/feature-flags/config',
          expect.any(Object),
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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });


        const result = await client.evaluateFlag('dark-mode');

        expect(result.flagKey).toBe('dark-mode');
        expect(result.enabled).toBe(true);
        expect(result.value).toBe(true);
        expect(result.valueType).toBe('boolean');

        // Should not make another fetch call
        expect(mockFetch).toHaveBeenCalledTimes(1);

        client.close();
      });

      it('should return FLAG_NOT_FOUND for unknown flag', async () => {
        const mockConfig = createMockConfig();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig,
        });

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });


        const result = await client.evaluateFlag('unknown-flag');

        expect(result.reason).toBe('ERROR');
        expect(result.errorCode).toBe('FLAG_NOT_FOUND');

        client.close();
      });
    });

    describe('getBooleanValue (local)', () => {
      it('should return boolean value', async () => {
        const mockConfig = createMockConfig();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig,
        });

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });


        const result = await client.getBooleanValue('dark-mode', false);
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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });


        const result = await client.getBooleanValue('disabled-flag', true);
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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });


        await expect(
          client.getBooleanValue('api-url', false),
        ).rejects.toThrow(TypeMismatchError);

        client.close();
      });
    });

    describe('segment targeting (local)', () => {
      it('should match segment rules', async () => {
        const mockConfig = createMockConfig();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig,
        });

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });


        // Premium user should get true
        const premiumResult = await client.getBooleanValue(
          'premium-feature',
          false,
          {
            targetingKey: 'user-1',
            plan: 'premium',
          },
        );
        expect(premiumResult).toBe(true);

        // Free user should get default (false)
        const freeResult = await client.getBooleanValue(
          'premium-feature',
          false,
          {
            targetingKey: 'user-2',
            plan: 'free',
          },
        );
        expect(freeResult).toBe(false);

        client.close();
      });
    });

    describe('getSnapshot (local)', () => {
      it('should return all evaluated flags', async () => {
        const mockConfig = createMockConfig();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig,
        });

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });


        const snapshot = await client.getSnapshot();

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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
        });


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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
        });


        // First call shouldn't have ETag
        expect(
          mockFetch.mock.calls[0][1].headers['If-None-Match'],
        ).toBeUndefined();

        // Advance timer to trigger polling
        await vi.advanceTimersByTimeAsync(5000);

        // Second call should have ETag
        expect(mockFetch.mock.calls[1][1].headers['If-None-Match']).toBe(
          '"abc123"',
        );

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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
        });
        await client.waitUntilReady();

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
        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
        });
        client.on(listener);
        await client.waitUntilReady();

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
        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
          onConfigurationChange,
        });
        await client.waitUntilReady();

        // Advance timer to trigger polling
        await vi.advanceTimersByTimeAsync(5000);

        expect(onConfigurationChange).toHaveBeenCalledWith(mockConfig2);

        client.close();
      });

      it('should return updated flag value after backend changes config', async () => {
        // Initial config: dark-mode is true
        const mockConfig1: FlagConfiguration = {
          environmentId: 'env-123',
          schemaVersion: '1.0',
          generatedAt: new Date().toISOString(),
          etag: '"v1"',
          flags: [
            {
              key: 'dark-mode',
              valueType: 'boolean',
              defaultEnabled: true,
              defaultValue: true, // Initially true
              rules: [],
            },
          ],
          segments: [],
        };

        // Updated config: dark-mode is now false
        const mockConfig2: FlagConfiguration = {
          environmentId: 'env-123',
          schemaVersion: '1.0',
          generatedAt: new Date().toISOString(),
          etag: '"v2"',
          flags: [
            {
              key: 'dark-mode',
              valueType: 'boolean',
              defaultEnabled: true,
              defaultValue: false, // Changed to false
              rules: [],
            },
          ],
          segments: [],
        };

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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
        });


        // First evaluation: should be true
        const value1 = await client.getBooleanValue('dark-mode', false);
        expect(value1).toBe(true);

        // Advance timer to trigger polling - backend returns new config
        await vi.advanceTimersByTimeAsync(5000);

        // Second evaluation: should now be false (updated value)
        const value2 = await client.getBooleanValue('dark-mode', false);
        expect(value2).toBe(false);

        client.close();
      });

      it('should return updated flag value when targeting rules change', async () => {
        // Initial config: premium-feature disabled by default, enabled for premium users
        const mockConfig1: FlagConfiguration = {
          environmentId: 'env-123',
          schemaVersion: '1.0',
          generatedAt: new Date().toISOString(),
          etag: '"v1"',
          flags: [
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
          ],
          segments: [
            {
              key: 'premium-users',
              name: 'Premium Users',
              rules: [{ field: 'plan', operator: 'eq', value: 'premium' }],
            },
          ],
        };

        // Updated config: now enabled for all users
        const mockConfig2: FlagConfiguration = {
          environmentId: 'env-123',
          schemaVersion: '1.0',
          generatedAt: new Date().toISOString(),
          etag: '"v2"',
          flags: [
            {
              key: 'premium-feature',
              valueType: 'boolean',
              defaultEnabled: true, // Now enabled by default
              defaultValue: true,
              rules: [],
            },
          ],
          segments: [],
        };

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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
        });


        // Free user initially gets false
        const value1 = await client.getBooleanValue('premium-feature', false, {
          targetingKey: 'user-1',
          plan: 'free',
        });
        expect(value1).toBe(false);

        // Advance timer to trigger polling
        await vi.advanceTimersByTimeAsync(5000);

        // Same free user now gets true (feature enabled for everyone)
        const value2 = await client.getBooleanValue('premium-feature', false, {
          targetingKey: 'user-1',
          plan: 'free',
        });
        expect(value2).toBe(true);

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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
        });
        await client.waitUntilReady();

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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });
        await client.waitUntilReady();

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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });
        await client.waitUntilReady();

        expect(client.hasFlag('dark-mode')).toBe(true);
        expect(client.hasFlag('unknown-flag')).toBe(false);

        client.close();
      });

      it('should return empty for remote evaluation mode', () => {
        const client = new FlagsClient({ token: 'test-token' });
        expect(client.getFlagKeys()).toEqual([]);
        expect(client.hasFlag('any-flag')).toBe(false);
      });
    });

    describe('refresh', () => {
      it('should fetch configuration when called', async () => {
        const mockConfig = createMockConfig();
        const mockConfig2 = { ...createMockConfig(), etag: '"new-etag"' };
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockConfig,
          })
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockConfig2,
          });

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });


        expect(mockFetch).toHaveBeenCalledTimes(1);

        await client.refresh();

        expect(mockFetch).toHaveBeenCalledTimes(2);

        client.close();
      });

      it('should be no-op for remote evaluation mode', async () => {
        const client = new FlagsClient({ token: 'test-token' });
        await client.refresh();
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    describe('getConfiguration', () => {
      it('should return null for remote evaluation mode', () => {
        const client = new FlagsClient({ token: 'test-token' });
        expect(client.getConfiguration()).toBeNull();
      });

      it('should return configuration for local evaluation mode', async () => {
        const mockConfig = createMockConfig();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig,
        });

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });
        await client.waitUntilReady();

        const config = client.getConfiguration();
        expect(config).toEqual(mockConfig);

        client.close();
      });
    });

    describe('initialConfiguration', () => {
      it('should use initial configuration without fetching', async () => {
        const mockConfig = createMockConfig();

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          initialConfiguration: mockConfig,
          environmentRefreshIntervalSeconds: 0,
        });

        // Should be ready immediately without fetch
        const result = await client.getBooleanValue('dark-mode', false);
        expect(result).toBe(true);

        // Should not have made any fetch calls for evaluation
        expect(mockFetch).not.toHaveBeenCalled();

        client.close();
      });
    });

    describe('onError callback', () => {
      it('should call onError when polling fails', async () => {
        const mockConfig = createMockConfig();
        const onError = vi.fn();

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockConfig,
          })
          .mockRejectedValueOnce(new Error('Network error'));

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
          onError,
        });
        await client.waitUntilReady();

        // Advance timer to trigger polling
        await vi.advanceTimersByTimeAsync(5000);

        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(onError.mock.calls[0][0].message).toBe('Network error');

        client.close();
      });

      it('should emit error event when polling fails', async () => {
        const mockConfig = createMockConfig();
        const listener = vi.fn();

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockConfig,
          })
          .mockRejectedValueOnce(new Error('Network error'));

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
        });
        client.on(listener);
        await client.waitUntilReady();

        // Advance timer to trigger polling
        await vi.advanceTimersByTimeAsync(5000);

        expect(listener).toHaveBeenCalledWith({
          type: 'error',
          error: expect.any(Error),
        });

        client.close();
      });
    });

    describe('listener removal with off', () => {
      it('should remove listener with off', async () => {
        const mockConfig = createMockConfig();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig,
        });

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });

        const listener = vi.fn();
        client.on(listener);
        client.off(listener);
        await client.waitUntilReady();

        // Listener should not have been called (was removed before ready event)
        expect(listener).not.toHaveBeenCalled();

        client.close();
      });

      it('should return unsubscribe function from on', async () => {
        const mockConfig = createMockConfig();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig,
        });

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });

        const listener = vi.fn();
        const unsubscribe = client.on(listener);
        unsubscribe();
        await client.waitUntilReady();



        // Listener should not have been called
        expect(listener).not.toHaveBeenCalled();

        client.close();
      });
    });

    describe('listener error handling', () => {
      it('should not throw when listener throws', async () => {
        const mockConfig = createMockConfig();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockConfig,
        });

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });

        const throwingListener = () => {
          throw new Error('Listener error');
        };
        const normalListener = vi.fn();

        client.on(throwingListener);
        client.on(normalListener);

        // Should not throw when awaiting (listeners are called during init)
        await client.waitUntilReady();

        // Other listeners should still be called
        expect(normalListener).toHaveBeenCalled();

        client.close();
      });
    });

    describe('concurrent initialization prevention', () => {
      it('should only initialize once when called multiple times', async () => {
        const mockConfig = createMockConfig();
        let resolveConfig: () => void;
        const configPromise = new Promise<void>((resolve) => {
          resolveConfig = resolve;
        });

        mockFetch.mockImplementation(async () => {
          await configPromise;
          return {
            ok: true,
            status: 200,
            json: async () => mockConfig,
          };
        });

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });

        // Start multiple initializations (auto-init already started, these should return same promise)
        const init1 = client.waitUntilReady();
        const init2 = client.waitUntilReady();
        const init3 = client.waitUntilReady();

        // Resolve the config fetch
        resolveConfig!();

        await Promise.all([init1, init2, init3]);

        // Should only have made one fetch call
        expect(mockFetch).toHaveBeenCalledTimes(1);

        client.close();
      });
    });
  });

  // ==================== Remote Evaluation Caching ====================

  describe('Remote Evaluation Caching', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('cache hit', () => {
      it('should return cached snapshot on second call', async () => {
        const mockResponse = {
          projectId: 'proj-123',
          environmentId: 'env-456',
          evaluatedAt: '2024-01-15T10:30:00Z',
          flags: [],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const client = new FlagsClient({
          token: 'test-token',
          cacheTtl: 60000,
        });

        // First call - should fetch
        const result1 = await client.getSnapshot();
        expect(result1).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledTimes(1);

        // Second call - should use cache
        const result2 = await client.getSnapshot();
        expect(result2).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledTimes(1); // No additional fetch
      });

      it('should return cached flag on second call', async () => {
        const mockResponse = {
          flagKey: 'dark-mode',
          enabled: true,
          valueType: 'boolean',
          value: true,
          reason: 'STATIC',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const client = new FlagsClient({
          token: 'test-token',
          cacheTtl: 60000,
        });

        // First call
        await client.evaluateFlag('dark-mode');
        expect(mockFetch).toHaveBeenCalledTimes(1);

        // Second call - should use cache
        await client.evaluateFlag('dark-mode');
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should cache by context', async () => {
        const mockResponse1 = {
          flagKey: 'feature',
          enabled: true,
          valueType: 'boolean',
          value: true,
          reason: 'TARGETING_MATCH',
        };
        const mockResponse2 = {
          flagKey: 'feature',
          enabled: false,
          valueType: 'boolean',
          value: false,
          reason: 'DEFAULT',
        };

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse1,
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse2,
          });

        const client = new FlagsClient({
          token: 'test-token',
          cacheTtl: 60000,
        });

        // Call with user-1
        await client.evaluateFlag('feature', {
          context: { targetingKey: 'user-1' },
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);

        // Call with user-2 - different context, should fetch
        await client.evaluateFlag('feature', {
          context: { targetingKey: 'user-2' },
        });
        expect(mockFetch).toHaveBeenCalledTimes(2);

        // Call with user-1 again - should use cache
        await client.evaluateFlag('feature', {
          context: { targetingKey: 'user-1' },
        });
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('cache expiration', () => {
      it('should fetch again after cache TTL expires', async () => {
        const mockResponse = {
          flagKey: 'dark-mode',
          enabled: true,
          valueType: 'boolean',
          value: true,
          reason: 'STATIC',
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const client = new FlagsClient({
          token: 'test-token',
          cacheTtl: 1000, // 1 second TTL
        });

        // First call
        await client.evaluateFlag('dark-mode');
        expect(mockFetch).toHaveBeenCalledTimes(1);

        // Advance time past TTL
        vi.advanceTimersByTime(1500);

        // Second call - cache expired, should fetch again
        await client.evaluateFlag('dark-mode');
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('clearCache', () => {
      it('should clear cache and fetch again', async () => {
        const mockResponse = {
          flagKey: 'dark-mode',
          enabled: true,
          valueType: 'boolean',
          value: true,
          reason: 'STATIC',
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const client = new FlagsClient({
          token: 'test-token',
          cacheTtl: 60000,
        });

        // First call
        await client.evaluateFlag('dark-mode');
        expect(mockFetch).toHaveBeenCalledTimes(1);

        // Clear cache
        client.clearCache();

        // Second call - should fetch again
        await client.evaluateFlag('dark-mode');
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('getCachedSnapshotSync', () => {
      it('should return cached snapshot synchronously', async () => {
        const mockResponse = {
          projectId: 'proj-123',
          environmentId: 'env-456',
          evaluatedAt: '2024-01-15T10:30:00Z',
          flags: [],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const client = new FlagsClient({
          token: 'test-token',
          cacheTtl: 60000,
        });

        // Should return null before any fetch
        expect(client.getCachedSnapshotSync()).toBeNull();

        // Fetch snapshot
        await client.getSnapshot();

        // Now should return cached value
        const cached = client.getCachedSnapshotSync();
        expect(cached).toEqual(mockResponse);
      });

      it('should return null when cache expires', async () => {
        const mockResponse = {
          projectId: 'proj-123',
          environmentId: 'env-456',
          evaluatedAt: '2024-01-15T10:30:00Z',
          flags: [],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const client = new FlagsClient({
          token: 'test-token',
          cacheTtl: 1000,
        });

        await client.getSnapshot();
        expect(client.getCachedSnapshotSync()).not.toBeNull();

        // Advance past TTL
        vi.advanceTimersByTime(1500);

        expect(client.getCachedSnapshotSync()).toBeNull();
      });
    });
  });

  // ==================== Typed Details Methods ====================

  describe('Typed Details Methods', () => {
    describe('getStringDetails', () => {
      it('should return full resolution details for string', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'api-url',
            enabled: true,
            valueType: 'string',
            value: 'https://api.example.com',
            variant: 'production',
            reason: 'STATIC',
            flagMetadata: { description: 'API URL' },
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        const result = await client.getStringDetails('api-url', 'default');

        expect(result).toEqual({
          value: 'https://api.example.com',
          variant: 'production',
          reason: 'STATIC',
          errorCode: undefined,
          errorMessage: undefined,
          flagMetadata: { description: 'API URL' },
        });
      });

      it('should throw TypeMismatchError for wrong type', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'dark-mode',
            enabled: true,
            valueType: 'boolean',
            value: true,
            reason: 'STATIC',
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        await expect(
          client.getStringDetails('dark-mode', 'default'),
        ).rejects.toThrow(TypeMismatchError);
      });
    });

    describe('getNumberDetails', () => {
      it('should return full resolution details for number', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'max-items',
            enabled: true,
            valueType: 'number',
            value: 100,
            variant: 'high-limit',
            reason: 'TARGETING_MATCH',
            flagMetadata: { tier: 'premium' },
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        const result = await client.getNumberDetails('max-items', 10);

        expect(result).toEqual({
          value: 100,
          variant: 'high-limit',
          reason: 'TARGETING_MATCH',
          errorCode: undefined,
          errorMessage: undefined,
          flagMetadata: { tier: 'premium' },
        });
      });

      it('should throw TypeMismatchError for wrong type', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'dark-mode',
            enabled: true,
            valueType: 'boolean',
            value: true,
            reason: 'STATIC',
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        await expect(
          client.getNumberDetails('dark-mode', 0),
        ).rejects.toThrow(TypeMismatchError);
      });
    });

    describe('getJsonDetails', () => {
      it('should return full resolution details for JSON', async () => {
        const jsonValue = { theme: 'dark', fontSize: 14 };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'ui-config',
            enabled: true,
            valueType: 'json',
            value: jsonValue,
            variant: 'dark-theme',
            reason: 'TARGETING_MATCH',
            flagMetadata: { version: 2 },
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        const result = await client.getJsonDetails('ui-config', {});

        expect(result).toEqual({
          value: jsonValue,
          variant: 'dark-theme',
          reason: 'TARGETING_MATCH',
          errorCode: undefined,
          errorMessage: undefined,
          flagMetadata: { version: 2 },
        });
      });

      it('should throw TypeMismatchError for wrong type', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            flagKey: 'dark-mode',
            enabled: true,
            valueType: 'boolean',
            value: true,
            reason: 'STATIC',
          }),
        });

        const client = new FlagsClient({ token: 'test-token' });
        await expect(
          client.getJsonDetails('dark-mode', {}),
        ).rejects.toThrow(TypeMismatchError);
      });
    });
  });

  // ==================== Custom baseUrl ====================

  describe('Custom baseUrl', () => {
    it('should use custom baseUrl for remote evaluation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          projectId: 'proj-123',
          environmentId: 'env-456',
          evaluatedAt: '2024-01-15T10:30:00Z',
          flags: [],
        }),
      });

      const client = new FlagsClient({
        token: 'test-token',
        baseUrl: 'https://custom.api.example.com',
      });
      await client.getSnapshot();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.example.com/v1/feature-flags/snapshot',
        expect.any(Object),
      );
    });

    it('should use custom baseUrl for local evaluation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          environmentId: 'env-123',
          schemaVersion: '1.0',
          generatedAt: new Date().toISOString(),
          etag: '"abc123"',
          flags: [],
          segments: [],
        }),
      });

      const client = new FlagsClient({
        token: 'test-token',
        baseUrl: 'https://custom.api.example.com',
        enableLocalEvaluation: true,
        environmentRefreshIntervalSeconds: 0,
      });


      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.example.com/v1/feature-flags/config',
        expect.any(Object),
      );

      client.close();
    });
  });

  // ==================== Error Handling Edge Cases ====================

  describe('Error Handling Edge Cases', () => {
    it('should throw FlagNotFoundError on 404 with flagKey in response', async () => {
      const { FlagNotFoundError } = await import('./errors.js');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ flagKey: 'unknown-flag' }),
      });

      const client = new FlagsClient({ token: 'test-token' });
      await expect(client.evaluateFlag('unknown-flag')).rejects.toThrow(
        FlagNotFoundError,
      );
    });

    it('should throw ApiError on 404 without flagKey in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Resource not found' }),
      });

      const client = new FlagsClient({ token: 'test-token' });
      await expect(client.evaluateFlag('some-flag')).rejects.toThrow(ApiError);
    });

    it('should handle JSON parse error in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const client = new FlagsClient({ token: 'test-token' });
      await expect(client.getSnapshot()).rejects.toThrow(ApiError);
    });

    it('should use error field from response if message is not present', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Custom error message' }),
      });

      const client = new FlagsClient({ token: 'test-token' });
      try {
        await client.getSnapshot();
      } catch (error) {
        expect((error as ApiError).message).toBe('Custom error message');
      }
    });
  });

  // ==================== getCachedSnapshotSync for Local Evaluation ====================

  describe('getCachedSnapshotSync for Local Evaluation', () => {
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
      ],
      segments: [],
    });

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return null when not ready', () => {
      const client = new FlagsClient({
        token: 'test-token',
        enableLocalEvaluation: true,
      });

      expect(client.getCachedSnapshotSync()).toBeNull();

      client.close();
    });

    it('should return snapshot synchronously when ready', async () => {
      const mockConfig = createMockConfig();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new FlagsClient({
        token: 'test-token',
        enableLocalEvaluation: true,
        environmentRefreshIntervalSeconds: 0,
      });
      await client.waitUntilReady();

      const snapshot = client.getCachedSnapshotSync();

      expect(snapshot).not.toBeNull();
      expect(snapshot?.environmentId).toBe('env-123');
      expect(snapshot?.flags).toHaveLength(1);
      expect(snapshot?.flags[0].flagKey).toBe('dark-mode');

      client.close();
    });

    it('should evaluate with context synchronously', async () => {
      const mockConfig: FlagConfiguration = {
        environmentId: 'env-123',
        schemaVersion: '1.0',
        generatedAt: new Date().toISOString(),
        etag: '"abc123"',
        flags: [
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
        ],
        segments: [
          {
            key: 'premium-users',
            name: 'Premium Users',
            rules: [{ field: 'plan', operator: 'eq', value: 'premium' }],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfig,
      });

      const client = new FlagsClient({
        token: 'test-token',
        enableLocalEvaluation: true,
        environmentRefreshIntervalSeconds: 0,
      });
      await client.waitUntilReady();

      // Premium user
      const premiumSnapshot = client.getCachedSnapshotSync({
        targetingKey: 'user-1',
        plan: 'premium',
      });
      expect(premiumSnapshot?.flags[0].value).toBe(true);

      // Free user - flag is disabled (defaultEnabled: false), so value is null
      const freeSnapshot = client.getCachedSnapshotSync({
        targetingKey: 'user-2',
        plan: 'free',
      });
      expect(freeSnapshot?.flags[0].enabled).toBe(false);
      expect(freeSnapshot?.flags[0].value).toBeNull();

      client.close();
    });
  });
});
