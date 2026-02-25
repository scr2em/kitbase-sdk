import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { type ReactNode } from 'react';

const mockInstance = {
  track: vi.fn().mockResolvedValue({ id: 'evt-1' }),
  identify: vi.fn().mockResolvedValue(undefined),
  trackPageView: vi.fn().mockResolvedValue({ id: 'pv-1' }),
  trackRevenue: vi.fn().mockResolvedValue({ id: 'rev-1' }),
  trackOutboundLink: vi.fn().mockResolvedValue({ id: 'out-1' }),
  trackClick: vi.fn().mockResolvedValue({ id: 'click-1' }),
  timeEvent: vi.fn(),
  cancelTimeEvent: vi.fn(),
  getEventDuration: vi.fn().mockReturnValue(1500),
  getTimedEvents: vi.fn().mockReturnValue([]),
  register: vi.fn(),
  registerOnce: vi.fn(),
  unregister: vi.fn(),
  getSuperProperties: vi.fn().mockReturnValue({}),
  clearSuperProperties: vi.fn(),
  getUserId: vi.fn().mockReturnValue(null),
  reset: vi.fn(),
  setDebugMode: vi.fn(),
  isDebugMode: vi.fn().mockReturnValue(false),
  shutdown: vi.fn(),
  use: vi.fn(),
  getPlugins: vi.fn().mockReturnValue([]),
};

// Mock KitbaseAnalytics
vi.mock('@kitbase/analytics', () => ({
  KitbaseAnalytics: vi.fn().mockImplementation(() => mockInstance),
  init: vi.fn(),
  getInstance: vi.fn(),
  KitbaseError: class KitbaseError extends Error {},
  ApiError: class ApiError extends Error {},
  AuthenticationError: class AuthenticationError extends Error {},
  ValidationError: class ValidationError extends Error {},
  TimeoutError: class TimeoutError extends Error {},
  detectBot: vi.fn(),
  isBot: vi.fn(),
  isUserAgentBot: vi.fn(),
  getUserAgent: vi.fn(),
  createDefaultPlugins: vi.fn(),
  PageViewPlugin: class {},
  OutboundLinksPlugin: class {},
  ClickTrackingPlugin: class {},
  ScrollDepthPlugin: class {},
  VisibilityPlugin: class {},
  WebVitalsPlugin: class {},
  FrustrationPlugin: class {},
}));

import {
  KitbaseAnalyticsProvider,
  useKitbaseAnalytics,
  useTrack,
  useIdentify,
  usePageView,
  useRevenue,
  useTimeEvent,
  useUserId,
  useReset,
} from './index.js';

import * as exports from './index.js';

function wrapper({ children }: { children: ReactNode }) {
  return (
    <KitbaseAnalyticsProvider config={{ token: 'test-token' }}>
      {children}
    </KitbaseAnalyticsProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('KitbaseAnalyticsProvider', () => {
  it('should provide the KitbaseAnalytics instance to children', () => {
    const { result } = renderHook(() => useKitbaseAnalytics(), { wrapper });
    expect(result.current).toBeDefined();
  });
});

describe('useKitbaseAnalytics', () => {
  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useKitbaseAnalytics());
    }).toThrow('useKitbaseAnalytics must be used within a KitbaseAnalyticsProvider');
  });

  it('should return the KitbaseAnalytics instance', () => {
    const { result } = renderHook(() => useKitbaseAnalytics(), { wrapper });
    expect(result.current).toBeDefined();
    expect(typeof result.current.track).toBe('function');
    expect(typeof result.current.use).toBe('function');
    expect(typeof result.current.getPlugins).toBe('function');
  });
});

describe('useTrack', () => {
  it('should return a track function', () => {
    const { result } = renderHook(() => useTrack(), { wrapper });
    expect(typeof result.current).toBe('function');
  });

  it('should call kitbase.track with options', async () => {
    const { result } = renderHook(() => useTrack(), { wrapper });
    const options = { channel: 'ui', event: 'Click' };

    await act(async () => {
      await result.current(options);
    });

    expect(mockInstance.track).toHaveBeenCalledWith(options);
  });
});

describe('useIdentify', () => {
  it('should call kitbase.identify with options', async () => {
    const { result } = renderHook(() => useIdentify(), { wrapper });
    const options = { userId: 'user-1', traits: { email: 'a@b.com' } };

    await act(async () => {
      await result.current(options);
    });

    expect(mockInstance.identify).toHaveBeenCalledWith(options);
  });
});

describe('usePageView', () => {
  it('should call kitbase.trackPageView', async () => {
    const { result } = renderHook(() => usePageView(), { wrapper });

    await act(async () => {
      await result.current({ path: '/test' });
    });

    expect(mockInstance.trackPageView).toHaveBeenCalledWith({ path: '/test' });
  });
});

describe('useRevenue', () => {
  it('should call kitbase.trackRevenue', async () => {
    const { result } = renderHook(() => useRevenue(), { wrapper });
    const options = { amount: 19.99, currency: 'USD' };

    await act(async () => {
      await result.current(options);
    });

    expect(mockInstance.trackRevenue).toHaveBeenCalledWith(options);
  });
});

describe('useTimeEvent', () => {
  it('should return start, stop, and getDuration', () => {
    const { result } = renderHook(() => useTimeEvent('Video Watched'), { wrapper });

    expect(typeof result.current.start).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.getDuration).toBe('function');
  });

  it('should delegate to kitbase methods', () => {
    const { result } = renderHook(() => useTimeEvent('Video Watched'), { wrapper });

    act(() => {
      result.current.start();
    });
    expect(mockInstance.timeEvent).toHaveBeenCalledWith('Video Watched');

    act(() => {
      result.current.stop();
    });
    expect(mockInstance.cancelTimeEvent).toHaveBeenCalledWith('Video Watched');

    act(() => {
      result.current.getDuration();
    });
    expect(mockInstance.getEventDuration).toHaveBeenCalledWith('Video Watched');
  });
});

describe('useUserId', () => {
  it('should return null when no user identified', () => {
    const { result } = renderHook(() => useUserId(), { wrapper });
    expect(result.current).toBeNull();
  });

  it('should return user ID when set', () => {
    mockInstance.getUserId.mockReturnValue('user-42');
    const { result } = renderHook(() => useUserId(), { wrapper });
    expect(result.current).toBe('user-42');
  });
});

describe('useReset', () => {
  it('should call kitbase.reset', () => {
    const { result } = renderHook(() => useReset(), { wrapper });

    act(() => {
      result.current();
    });

    expect(mockInstance.reset).toHaveBeenCalled();
  });
});

describe('re-exports from core', () => {
  it('should re-export error classes', () => {
    expect(exports.KitbaseError).toBeDefined();
    expect(exports.ValidationError).toBeDefined();
    expect(exports.ApiError).toBeDefined();
    expect(exports.AuthenticationError).toBeDefined();
    expect(exports.TimeoutError).toBeDefined();
  });

  it('should re-export bot detection utilities', () => {
    expect(exports.detectBot).toBeDefined();
    expect(typeof exports.isBot).toBe('function');
  });

  it('should re-export plugin classes', () => {
    expect(exports.PageViewPlugin).toBeDefined();
    expect(exports.ScrollDepthPlugin).toBeDefined();
    expect(exports.WebVitalsPlugin).toBeDefined();
    expect(exports.FrustrationPlugin).toBeDefined();
  });

  it('should re-export KitbaseAnalytics class', () => {
    expect(exports.KitbaseAnalytics).toBeDefined();
  });
});
