import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Kitbase } from './client.js';
import {
  ValidationError,
  AuthenticationError,
  ApiError,
  TimeoutError,
} from './errors.js';

describe('Kitbase', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should throw ValidationError when token is missing', () => {
      expect(() => new Kitbase({ token: '' })).toThrow(ValidationError);
      expect(() => new Kitbase({ token: '' })).toThrow('API token is required');
    });

    it('should create client with valid config', () => {
      const client = new Kitbase({ token: 'test-token' });
      expect(client).toBeInstanceOf(Kitbase);
    });
  });

  describe('track', () => {
    it('should throw ValidationError when event is missing', async () => {
      const client = new Kitbase({ token: 'test-token' });
      await expect(
        client.track({ channel: 'test', event: '' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should successfully track an event', async () => {
      const mockResponse = {
        id: 'evt-123',
        event: 'Test Event',
        timestamp: '2024-01-15T10:30:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new Kitbase({ token: 'test-token' });
      const result = await client.track({
        channel: 'test',
        event: 'Test Event',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.kitbase.dev/v1/logs',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }),
      );
    });

    it('should send all optional fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'evt-123',
          event: 'Test Event',
          timestamp: '2024-01-15T10:30:00Z',
        }),
      });

      const client = new Kitbase({ token: 'test-token' });
      await client.track({
        channel: 'payments',
        event: 'New Subscription',
        user_id: 'user-123',
        icon: '💰',
        notify: true,
        description: 'User subscribed',
        tags: { plan: 'premium', trial: false },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({
        channel: 'payments',
        event: 'New Subscription',
        user_id: 'user-123',
        anonymous_id: expect.any(String),
        icon: '💰',
        notify: true,
        description: 'User subscribed',
        tags: { plan: 'premium', trial: false },
      });
    });

    it('should throw AuthenticationError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid API key' }),
      });

      const client = new Kitbase({ token: 'invalid-token' });
      await expect(
        client.track({ channel: 'test', event: 'Test Event' }),
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw ApiError on other HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid channel' }),
      });

      const client = new Kitbase({ token: 'test-token' });
      await expect(
        client.track({ channel: 'test', event: 'Test Event' }),
      ).rejects.toThrow(ApiError);
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

      const client = new Kitbase({ token: 'test-token' });
      await expect(
        client.track({ channel: 'test', event: 'Test Event' }),
      ).rejects.toThrow(TimeoutError);
    });
  });
});








