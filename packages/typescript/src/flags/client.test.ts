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
              Authorization: 'Bearer test-token',
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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });
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
        await client.initialize(); // Should not throw
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
        await client.initialize();

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
        await client.initialize();

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
        await client.initialize();

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
        await client.initialize();

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
        await client.initialize();

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
        await client.initialize();

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
        await client.initialize();

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
        await client.initialize();

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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
        });
        await client.initialize();

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
        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
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
        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 5,
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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });
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

        const client = new FlagsClient({
          token: 'test-token',
          enableLocalEvaluation: true,
          environmentRefreshIntervalSeconds: 0,
        });
        await client.initialize();

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
  });
});
