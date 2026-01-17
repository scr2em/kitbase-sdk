import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Changelogs } from './client.js';
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ApiError,
  TimeoutError,
} from './errors.js';

describe('Changelogs', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should throw ValidationError when token is missing', () => {
      expect(() => new Changelogs({ token: '' })).toThrow(ValidationError);
      expect(() => new Changelogs({ token: '' })).toThrow(
        'API token is required',
      );
    });

    it('should create client with valid config', () => {
      const client = new Changelogs({ token: 'test-token' });
      expect(client).toBeInstanceOf(Changelogs);
    });
  });

  describe('get', () => {
    it('should throw ValidationError when version is missing', async () => {
      const client = new Changelogs({ token: 'test-token' });
      await expect(client.get('')).rejects.toThrow(ValidationError);
      await expect(client.get('')).rejects.toThrow('Version is required');
    });

    it('should successfully get a changelog', async () => {
      const mockResponse = {
        id: 'cl-123',
        version: '1.0.0',
        markdown: '## What\'s New\n\n- Added feature X\n- Fixed bug Y',
        isPublished: true,
        projectId: 'proj-456',
        createdAt: '2024-01-14T08:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new Changelogs({ token: 'test-token' });
      const result = await client.get('1.0.0');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.kitbase.dev/sdk/v1/changelogs/1.0.0',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-sdk-key': 'test-token',
          },
        }),
      );
    });

    it('should URL encode the version', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cl-123',
          version: '1.0.0-beta.1',
          markdown: '## Beta Release',
          isPublished: true,
          projectId: 'proj-456',
          createdAt: '2024-01-14T08:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        }),
      });

      const client = new Changelogs({ token: 'test-token' });
      await client.get('1.0.0-beta.1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.kitbase.dev/sdk/v1/changelogs/1.0.0-beta.1',
        expect.any(Object),
      );
    });

    it('should throw AuthenticationError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid API key' }),
      });

      const client = new Changelogs({ token: 'invalid-token' });
      await expect(client.get('1.0.0')).rejects.toThrow(AuthenticationError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Changelog not found' }),
      });

      const client = new Changelogs({ token: 'test-token' });
      await expect(client.get('99.99.99')).rejects.toThrow(NotFoundError);
    });

    it('should throw ApiError on other HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      const client = new Changelogs({ token: 'test-token' });
      await expect(client.get('1.0.0')).rejects.toThrow(ApiError);
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

      const client = new Changelogs({ token: 'test-token' });
      await expect(client.get('1.0.0')).rejects.toThrow(TimeoutError);
    });
  });
});
