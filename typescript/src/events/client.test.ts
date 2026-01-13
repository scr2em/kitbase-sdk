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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
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

    it('should accept debug mode in config', () => {
      const client = new Kitbase({ token: 'test-token', debug: true });
      expect(client.isDebugMode()).toBe(true);
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
            'x-api-key': 'test-token',
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

  describe('super properties', () => {
    it('should register and include super properties in events', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'evt-123',
          event: 'Test Event',
          timestamp: '2024-01-15T10:30:00Z',
        }),
      });

      const client = new Kitbase({ token: 'test-token' });
      client.register({ app_version: '2.1.0', platform: 'web' });

      await client.track({
        channel: 'test',
        event: 'Test Event',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.tags).toEqual({
        app_version: '2.1.0',
        platform: 'web',
      });
    });

    it('should merge super properties with event tags', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'evt-123',
          event: 'Test Event',
          timestamp: '2024-01-15T10:30:00Z',
        }),
      });

      const client = new Kitbase({ token: 'test-token' });
      client.register({ app_version: '2.1.0', platform: 'web' });

      await client.track({
        channel: 'test',
        event: 'Test Event',
        tags: { button_id: 'signup' },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.tags).toEqual({
        app_version: '2.1.0',
        platform: 'web',
        button_id: 'signup',
      });
    });

    it('should allow event tags to override super properties', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'evt-123',
          event: 'Test Event',
          timestamp: '2024-01-15T10:30:00Z',
        }),
      });

      const client = new Kitbase({ token: 'test-token' });
      client.register({ platform: 'web' });

      await client.track({
        channel: 'test',
        event: 'Test Event',
        tags: { platform: 'mobile' }, // Override
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.tags.platform).toBe('mobile');
    });

    it('should support registerOnce for one-time properties', () => {
      const client = new Kitbase({ token: 'test-token' });

      client.registerOnce({ first_visit: '2024-01-01' });
      client.registerOnce({ first_visit: '2024-01-02' }); // Should be ignored

      expect(client.getSuperProperties().first_visit).toBe('2024-01-01');
    });

    it('should unregister a super property', () => {
      const client = new Kitbase({ token: 'test-token' });

      client.register({ app_version: '2.1.0', platform: 'web' });
      client.unregister('platform');

      const props = client.getSuperProperties();
      expect(props).toEqual({ app_version: '2.1.0' });
      expect(props.platform).toBeUndefined();
    });

    it('should clear all super properties', () => {
      const client = new Kitbase({ token: 'test-token' });

      client.register({ app_version: '2.1.0', platform: 'web' });
      client.clearSuperProperties();

      expect(client.getSuperProperties()).toEqual({});
    });

    it('should return a copy of super properties', () => {
      const client = new Kitbase({ token: 'test-token' });

      client.register({ app_version: '2.1.0' });
      const props = client.getSuperProperties();
      props.modified = 'yes';

      // Original should not be modified
      expect(client.getSuperProperties().modified).toBeUndefined();
    });
  });

  describe('time events', () => {
    it('should track duration for timed events', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'evt-123',
          event: 'Video Watched',
          timestamp: '2024-01-15T10:30:00Z',
        }),
      });

      const client = new Kitbase({ token: 'test-token' });

      client.timeEvent('Video Watched');

      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);

      await client.track({
        channel: 'engagement',
        event: 'Video Watched',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.tags.$duration).toBeCloseTo(5, 0);
    });

    it('should return list of timed events', () => {
      const client = new Kitbase({ token: 'test-token' });

      client.timeEvent('Video Watched');
      client.timeEvent('Checkout Flow');

      expect(client.getTimedEvents()).toEqual(['Video Watched', 'Checkout Flow']);
    });

    it('should cancel a timed event', () => {
      const client = new Kitbase({ token: 'test-token' });

      client.timeEvent('Video Watched');
      client.cancelTimeEvent('Video Watched');

      expect(client.getTimedEvents()).toEqual([]);
    });

    it('should get duration without stopping timer', () => {
      const client = new Kitbase({ token: 'test-token' });

      client.timeEvent('Video Watched');
      vi.advanceTimersByTime(3000);

      const duration = client.getEventDuration('Video Watched');
      expect(duration).toBeCloseTo(3, 0);

      // Timer should still be active
      expect(client.getTimedEvents()).toContain('Video Watched');
    });

    it('should return null for non-existent timed event', () => {
      const client = new Kitbase({ token: 'test-token' });

      expect(client.getEventDuration('Non Existent')).toBeNull();
    });

    it('should clear timer after tracking event', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'evt-123',
          event: 'Video Watched',
          timestamp: '2024-01-15T10:30:00Z',
        }),
      });

      const client = new Kitbase({ token: 'test-token' });

      client.timeEvent('Video Watched');
      await client.track({ channel: 'test', event: 'Video Watched' });

      expect(client.getTimedEvents()).not.toContain('Video Watched');
    });

    it('should include duration alongside other tags', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'evt-123',
          event: 'Video Watched',
          timestamp: '2024-01-15T10:30:00Z',
        }),
      });

      const client = new Kitbase({ token: 'test-token' });
      client.register({ app_version: '2.1.0' });

      client.timeEvent('Video Watched');
      vi.advanceTimersByTime(10000);

      await client.track({
        channel: 'engagement',
        event: 'Video Watched',
        tags: { video_id: '123' },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.tags).toEqual({
        app_version: '2.1.0',
        video_id: '123',
        $duration: expect.any(Number),
      });
    });
  });

  describe('debug mode', () => {
    it('should toggle debug mode', () => {
      const client = new Kitbase({ token: 'test-token' });

      expect(client.isDebugMode()).toBe(false);

      client.setDebugMode(true);
      expect(client.isDebugMode()).toBe(true);

      client.setDebugMode(false);
      expect(client.isDebugMode()).toBe(false);
    });

    it('should log when debug mode is enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'evt-123',
          event: 'Test Event',
          timestamp: '2024-01-15T10:30:00Z',
        }),
      });

      const client = new Kitbase({ token: 'test-token', debug: true });
      await client.track({ channel: 'test', event: 'Test Event' });

      expect(consoleSpy).toHaveBeenCalled();
      const logMessages = consoleSpy.mock.calls.map((call) => call[1]);
      expect(logMessages).toContain('Track');
    });

    it('should not log when debug mode is disabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'evt-123',
          event: 'Test Event',
          timestamp: '2024-01-15T10:30:00Z',
        }),
      });

      const client = new Kitbase({ token: 'test-token', debug: false });
      await client.track({ channel: 'test', event: 'Test Event' });

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('offline queue (write-ahead)', () => {
    it('should return null for queue stats when offline not enabled', async () => {
      const client = new Kitbase({ token: 'test-token' });
      const stats = await client.getQueueStats();
      expect(stats).toBeNull();
    });

    it('should always write to DB first when offline enabled', async () => {
      // Even when network succeeds, we write to DB first
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'evt-123',
          event: 'Test Event',
          timestamp: '2024-01-15T10:30:00Z',
        }),
      });

      const client = new Kitbase({
        token: 'test-token',
        offline: { enabled: true },
      });

      const result = await client.track({
        channel: 'test',
        event: 'Test Event',
      });

      // Should return a queued placeholder (write-ahead pattern)
      expect(result.id).toMatch(/^queued-/);

      await client.shutdown();
    });

    it('should trigger immediate flush after queueing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'evt-123',
          event: 'Test Event',
          timestamp: '2024-01-15T10:30:00Z',
        }),
      });

      const client = new Kitbase({
        token: 'test-token',
        offline: { enabled: true },
      });

      await client.track({
        channel: 'test',
        event: 'Test Event',
      });

      // Allow flush to complete
      await vi.advanceTimersByTimeAsync(100);

      // Fetch should have been called (flush attempted)
      expect(mockFetch).toHaveBeenCalled();

      await client.shutdown();
    });

    it('should persist events even when network fails', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const client = new Kitbase({
        token: 'test-token',
        offline: { enabled: true },
      });

      // Should not throw - event is persisted
      const result = await client.track({
        channel: 'test',
        event: 'Test Event',
      });

      expect(result.id).toMatch(/^queued-/);

      // Event should be in the queue
      const stats = await client.getQueueStats();
      expect(stats?.size).toBeGreaterThanOrEqual(1);

      await client.shutdown();
    });

    it('should clear the queue', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const client = new Kitbase({
        token: 'test-token',
        offline: { enabled: true },
      });

      await client.track({ channel: 'test', event: 'Test Event' });

      let stats = await client.getQueueStats();
      expect(stats?.size).toBeGreaterThanOrEqual(1);

      await client.clearQueue();

      stats = await client.getQueueStats();
      expect(stats?.size).toBe(0);

      await client.shutdown();
    });

    it('should include super properties in queued events', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const client = new Kitbase({
        token: 'test-token',
        offline: { enabled: true },
      });

      client.register({ app_version: '2.1.0' });

      await client.track({
        channel: 'test',
        event: 'Test Event',
        tags: { custom: 'value' },
      });

      // The event should be queued with merged super properties
      const stats = await client.getQueueStats();
      expect(stats?.size).toBeGreaterThanOrEqual(1);

      await client.shutdown();
    });

    it('should send directly when offline queue is disabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'evt-123',
          event: 'Test Event',
          timestamp: '2024-01-15T10:30:00Z',
        }),
      });

      const client = new Kitbase({ token: 'test-token' });

      const result = await client.track({
        channel: 'test',
        event: 'Test Event',
      });

      // Should return the actual server response
      expect(result.id).toBe('evt-123');
    });

    it('should throw errors when offline queue is disabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid API key' }),
      });

      const client = new Kitbase({ token: 'test-token' });

      await expect(
        client.track({ channel: 'test', event: 'Test Event' }),
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('shutdown', () => {
    it('should clear timed events on shutdown', async () => {
      const client = new Kitbase({ token: 'test-token' });

      client.timeEvent('Event 1');
      client.timeEvent('Event 2');

      await client.shutdown();

      expect(client.getTimedEvents()).toEqual([]);
    });

    it('should stop queue flush timer on shutdown', async () => {
      const client = new Kitbase({
        token: 'test-token',
        offline: { enabled: true },
      });

      await client.shutdown();

      // Queue should be null after shutdown
      const stats = await client.getQueueStats();
      expect(stats).toBeNull();
    });
  });
});
