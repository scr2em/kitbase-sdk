import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FlagsClient } from './client.js';
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



