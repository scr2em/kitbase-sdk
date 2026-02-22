import { describe, it, expect } from 'vitest';
import { ApiError } from '../client.js';
import { formatToolError } from '../errors.js';

describe('formatToolError', () => {
  it('formats 401 ApiError with auth message and request/response', () => {
    const error = new ApiError('GET', 'https://api.kitbase.dev/projects/abc/sessions', 401, 'Unauthorized');
    const result = formatToolError(error);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication failed');
    expect(result.content[0].text).toContain('Request: GET https://api.kitbase.dev/projects/abc/sessions');
    expect(result.content[0].text).toContain('Response: 401 Unauthorized');
  });

  it('formats 403 ApiError with auth message and request/response', () => {
    const error = new ApiError('GET', 'https://api.kitbase.dev/projects/abc/sessions', 403, 'Forbidden');
    const result = formatToolError(error);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Authentication failed');
    expect(result.content[0].text).toContain('Request: GET');
    expect(result.content[0].text).toContain('Response: 403 Forbidden');
  });

  it('formats 404 ApiError with not found message and request/response', () => {
    const error = new ApiError('GET', 'https://api.kitbase.dev/projects/abc/sessions/xyz', 404, 'Not Found');
    const result = formatToolError(error);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Resource not found');
    expect(result.content[0].text).toContain('Request: GET');
    expect(result.content[0].text).toContain('Response: 404 Not Found');
  });

  it('formats 429 ApiError with rate limit message and request/response', () => {
    const error = new ApiError('GET', 'https://api.kitbase.dev/projects/abc/sessions', 429, 'Too Many Requests');
    const result = formatToolError(error);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Rate limit exceeded');
    expect(result.content[0].text).toContain('Request: GET');
    expect(result.content[0].text).toContain('Response: 429 Too Many Requests');
  });

  it('formats other ApiError status codes with response body and request/response', () => {
    const error = new ApiError('POST', 'https://api.kitbase.dev/projects/abc/funnels/analyze', 500, 'Internal Server Error');
    const result = formatToolError(error);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Internal Server Error');
    expect(result.content[0].text).toContain('Request: POST');
    expect(result.content[0].text).toContain('Response: 500');
  });

  it('formats generic Error with message', () => {
    const error = new Error('Something went wrong');
    const result = formatToolError(error);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Something went wrong');
  });

  it('formats non-Error values as strings', () => {
    const result = formatToolError('unexpected error');

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('unexpected error');
  });

  it('formats null/undefined values', () => {
    expect(formatToolError(null).content[0].text).toBe('null');
    expect(formatToolError(undefined).content[0].text).toBe('undefined');
  });
});
