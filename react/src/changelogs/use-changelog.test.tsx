import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { ChangelogsContext } from './context';
import { useChangelog, useLazyChangelog } from './use-changelog';
import type { Changelogs, ChangelogResponse } from '@kitbase/sdk/changelogs';

const mockChangelogResponse: ChangelogResponse = {
  version: '2.0.0',
  title: 'Version 2.0.0 Release',
  markdown: '# Version 2.0.0\n\n- New feature X\n- Bug fix Y',
  publishedAt: '2024-01-15T10:00:00Z',
};

const createMockClient = (overrides: Partial<Changelogs> = {}) => ({
  get: vi.fn().mockResolvedValue(mockChangelogResponse),
  ...overrides,
} as unknown as Changelogs);

const createWrapper = (client: Changelogs) => {
  return ({ children }: { children: React.ReactNode }) => (
    <ChangelogsContext.Provider value={client}>
      {children}
    </ChangelogsContext.Provider>
  );
};

describe('useChangelog', () => {
  let mockClient: Changelogs;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch changelog on mount', async () => {
    const { result } = renderHook(
      () => useChangelog('2.0.0'),
      { wrapper: createWrapper(mockClient) }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockChangelogResponse);
    expect(result.current.error).toBeNull();
    expect(mockClient.get).toHaveBeenCalledWith('2.0.0');
  });

  it('should not fetch when version is empty', async () => {
    const { result } = renderHook(
      () => useChangelog(''),
      { wrapper: createWrapper(mockClient) }
    );

    // Wait a tick to ensure effect has run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockClient.get).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should not fetch when enabled is false', async () => {
    const { result } = renderHook(
      () => useChangelog('2.0.0', { enabled: false }),
      { wrapper: createWrapper(mockClient) }
    );

    // Wait a tick to ensure effect has run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockClient.get).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should fetch when enabled becomes true', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useChangelog('2.0.0', { enabled }),
      {
        wrapper: createWrapper(mockClient),
        initialProps: { enabled: false },
      }
    );

    expect(mockClient.get).not.toHaveBeenCalled();

    rerender({ enabled: true });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.get).toHaveBeenCalledWith('2.0.0');
    expect(result.current.data).toEqual(mockChangelogResponse);
  });

  it('should handle errors', async () => {
    const error = new Error('Not Found');
    mockClient = createMockClient({
      get: vi.fn().mockRejectedValue(error),
    });

    const { result } = renderHook(
      () => useChangelog('invalid-version'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle non-Error exceptions', async () => {
    mockClient = createMockClient({
      get: vi.fn().mockRejectedValue('string error'),
    });

    const { result } = renderHook(
      () => useChangelog('2.0.0'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error?.message).toBe('string error');
  });

  it('should refetch when version changes', async () => {
    const { result, rerender } = renderHook(
      ({ version }) => useChangelog(version),
      {
        wrapper: createWrapper(mockClient),
        initialProps: { version: '1.0.0' },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockClient.get).toHaveBeenCalledWith('1.0.0');

    vi.clearAllMocks();

    rerender({ version: '2.0.0' });

    await waitFor(() => {
      expect(mockClient.get).toHaveBeenCalledWith('2.0.0');
    });
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(
      () => useChangelog('2.0.0'),
      { wrapper: createWrapper(mockClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = (mockClient.get as ReturnType<typeof vi.fn>).mock.calls.length;

    await act(async () => {
      await result.current.refetch();
    });

    expect((mockClient.get as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('should set loading state during fetch', async () => {
    let resolveGet: (value: ChangelogResponse) => void = () => {};
    mockClient = createMockClient({
      get: vi.fn().mockImplementation(() => new Promise((resolve) => {
        resolveGet = resolve;
      })),
    });

    const { result } = renderHook(
      () => useChangelog('2.0.0'),
      { wrapper: createWrapper(mockClient) }
    );

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveGet(mockChangelogResponse);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockChangelogResponse);
  });
});

describe('useLazyChangelog', () => {
  let mockClient: Changelogs;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(
      () => useLazyChangelog(),
      { wrapper: createWrapper(mockClient) }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.fetch).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should not fetch on mount', () => {
    renderHook(
      () => useLazyChangelog(),
      { wrapper: createWrapper(mockClient) }
    );

    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it('should fetch changelog when called', async () => {
    const { result } = renderHook(
      () => useLazyChangelog(),
      { wrapper: createWrapper(mockClient) }
    );

    let response: ChangelogResponse | undefined;
    await act(async () => {
      response = await result.current.fetch('2.0.0');
    });

    expect(response).toEqual(mockChangelogResponse);
    expect(result.current.data).toEqual(mockChangelogResponse);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockClient.get).toHaveBeenCalledWith('2.0.0');
  });

  it('should set loading state during fetch', async () => {
    let resolveGet: (value: ChangelogResponse) => void = () => {};
    mockClient = createMockClient({
      get: vi.fn().mockImplementation(() => new Promise((resolve) => {
        resolveGet = resolve;
      })),
    });

    const { result } = renderHook(
      () => useLazyChangelog(),
      { wrapper: createWrapper(mockClient) }
    );

    act(() => {
      result.current.fetch('2.0.0');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveGet(mockChangelogResponse);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle errors', async () => {
    const error = new Error('Not Found');
    mockClient = createMockClient({
      get: vi.fn().mockRejectedValue(error),
    });

    const { result } = renderHook(
      () => useLazyChangelog(),
      { wrapper: createWrapper(mockClient) }
    );

    let response: ChangelogResponse | undefined;
    await act(async () => {
      response = await result.current.fetch('invalid-version');
    });

    expect(response).toBeUndefined();
    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle non-Error exceptions', async () => {
    mockClient = createMockClient({
      get: vi.fn().mockRejectedValue('string error'),
    });

    const { result } = renderHook(
      () => useLazyChangelog(),
      { wrapper: createWrapper(mockClient) }
    );

    await act(async () => {
      await result.current.fetch('2.0.0');
    });

    expect(result.current.error?.message).toBe('string error');
  });

  it('should reset state', async () => {
    const { result } = renderHook(
      () => useLazyChangelog(),
      { wrapper: createWrapper(mockClient) }
    );

    // First, fetch a changelog to populate state
    await act(async () => {
      await result.current.fetch('2.0.0');
    });

    expect(result.current.data).toEqual(mockChangelogResponse);

    // Reset state
    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should reset error state', async () => {
    const error = new Error('Not Found');
    mockClient = createMockClient({
      get: vi.fn().mockRejectedValue(error),
    });

    const { result } = renderHook(
      () => useLazyChangelog(),
      { wrapper: createWrapper(mockClient) }
    );

    await act(async () => {
      await result.current.fetch('invalid-version');
    });

    expect(result.current.error).toEqual(error);

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
  });

  it('should clear error on new fetch call', async () => {
    const error = new Error('Not Found');
    let shouldError = true;
    mockClient = createMockClient({
      get: vi.fn().mockImplementation(() => {
        if (shouldError) {
          return Promise.reject(error);
        }
        return Promise.resolve(mockChangelogResponse);
      }),
    });

    const { result } = renderHook(
      () => useLazyChangelog(),
      { wrapper: createWrapper(mockClient) }
    );

    // First call fails
    await act(async () => {
      await result.current.fetch('invalid-version');
    });

    expect(result.current.error).toEqual(error);

    // Second call succeeds
    shouldError = false;
    await act(async () => {
      await result.current.fetch('2.0.0');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(mockChangelogResponse);
  });

  it('should fetch different versions', async () => {
    const { result } = renderHook(
      () => useLazyChangelog(),
      { wrapper: createWrapper(mockClient) }
    );

    await act(async () => {
      await result.current.fetch('1.0.0');
    });

    expect(mockClient.get).toHaveBeenCalledWith('1.0.0');

    await act(async () => {
      await result.current.fetch('2.0.0');
    });

    expect(mockClient.get).toHaveBeenCalledWith('2.0.0');
    expect((mockClient.get as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });
});
