import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockInstance } = vi.hoisted(() => {
  const fn = vi.fn;
  const mockInstance = {
    track: fn().mockResolvedValue({ id: 'evt-1' }),
    identify: fn().mockResolvedValue(undefined),
    trackPageView: fn().mockResolvedValue({ id: 'pv-1' }),
    trackRevenue: fn().mockResolvedValue({ id: 'rev-1' }),
    trackOutboundLink: fn().mockResolvedValue({ id: 'out-1' }),
    trackClick: fn().mockResolvedValue({ id: 'click-1' }),
    timeEvent: fn(),
    cancelTimeEvent: fn(),
    getEventDuration: fn().mockReturnValue(1500),
    getTimedEvents: fn().mockReturnValue([]),
    register: fn(),
    registerOnce: fn(),
    unregister: fn(),
    getSuperProperties: fn().mockReturnValue({}),
    clearSuperProperties: fn(),
    getUserId: fn().mockReturnValue(null),
    reset: fn(),
    setDebugMode: fn(),
    isDebugMode: fn().mockReturnValue(false),
    shutdown: fn(),
    use: fn(),
    getPlugins: fn().mockReturnValue(['page-view', 'click-tracking']),
  };
  return { mockInstance };
});

// Mock @angular/core before importing the module under test
vi.mock('@angular/core', () => ({
  Provider: class {},
  makeEnvironmentProviders: vi.fn((providers: any[]) => ({ providers })),
  EnvironmentProviders: class {},
}));

// Mock KitbaseAnalytics core
vi.mock('@kitbase/analytics', () => ({
  init: vi.fn().mockReturnValue(mockInstance),
  getInstance: vi.fn().mockReturnValue(mockInstance),
  KitbaseAnalytics: vi.fn(),
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

import * as angularExports from './index.js';
const { provideKitbaseAnalytics, KitbaseAnalyticsService } = angularExports;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('provideKitbaseAnalytics', () => {
  it('should return environment providers', () => {
    const result = provideKitbaseAnalytics({ token: 'test-token' });
    expect(result).toBeDefined();
  });
});

describe('KitbaseAnalyticsService (via provideKitbaseAnalytics)', () => {
  function createService(): InstanceType<typeof KitbaseAnalyticsService> {
    const result = provideKitbaseAnalytics({ token: 'test-token' }) as any;
    // The first provider's useValue is the service instance
    return result.providers[0].useValue;
  }

  it('should return the underlying instance via getInstance()', () => {
    const service = createService();
    expect(service.getInstance()).toBe(mockInstance);
  });

  describe('Event Tracking', () => {
    it('should delegate track()', async () => {
      const service = createService();
      const opts = { channel: 'ui', event: 'Click' };
      await service.track(opts);
      expect(mockInstance.track).toHaveBeenCalledWith(opts);
    });

    it('should delegate trackPageView()', async () => {
      const service = createService();
      await service.trackPageView({ path: '/home' });
      expect(mockInstance.trackPageView).toHaveBeenCalledWith({ path: '/home' });
    });

    it('should delegate trackRevenue()', async () => {
      const service = createService();
      await service.trackRevenue({ amount: 9.99, currency: 'USD' });
      expect(mockInstance.trackRevenue).toHaveBeenCalledWith({ amount: 9.99, currency: 'USD' });
    });

    it('should delegate trackOutboundLink()', async () => {
      const service = createService();
      await service.trackOutboundLink({ url: 'https://example.com' });
      expect(mockInstance.trackOutboundLink).toHaveBeenCalledWith({ url: 'https://example.com' });
    });

    it('should delegate trackClick()', async () => {
      const service = createService();
      await service.trackClick({ button: 'cta' });
      expect(mockInstance.trackClick).toHaveBeenCalledWith({ button: 'cta' });
    });
  });

  describe('User Identification', () => {
    it('should delegate identify()', async () => {
      const service = createService();
      await service.identify({ userId: 'u1' });
      expect(mockInstance.identify).toHaveBeenCalledWith({ userId: 'u1' });
    });

    it('should delegate getUserId()', () => {
      const service = createService();
      mockInstance.getUserId.mockReturnValue('u1');
      expect(service.getUserId()).toBe('u1');
    });

    it('should delegate reset()', () => {
      const service = createService();
      service.reset();
      expect(mockInstance.reset).toHaveBeenCalled();
    });
  });

  describe('Super Properties', () => {
    it('should delegate register()', () => {
      const service = createService();
      service.register({ key: 'val' });
      expect(mockInstance.register).toHaveBeenCalledWith({ key: 'val' });
    });

    it('should delegate registerOnce()', () => {
      const service = createService();
      service.registerOnce({ key: 'val' });
      expect(mockInstance.registerOnce).toHaveBeenCalledWith({ key: 'val' });
    });

    it('should delegate unregister()', () => {
      const service = createService();
      service.unregister('key');
      expect(mockInstance.unregister).toHaveBeenCalledWith('key');
    });

    it('should delegate getSuperProperties()', () => {
      const service = createService();
      mockInstance.getSuperProperties.mockReturnValue({ a: 1 });
      expect(service.getSuperProperties()).toEqual({ a: 1 });
    });

    it('should delegate clearSuperProperties()', () => {
      const service = createService();
      service.clearSuperProperties();
      expect(mockInstance.clearSuperProperties).toHaveBeenCalled();
    });
  });

  describe('Time Events', () => {
    it('should delegate timeEvent()', () => {
      const service = createService();
      service.timeEvent('test');
      expect(mockInstance.timeEvent).toHaveBeenCalledWith('test');
    });

    it('should delegate cancelTimeEvent()', () => {
      const service = createService();
      service.cancelTimeEvent('test');
      expect(mockInstance.cancelTimeEvent).toHaveBeenCalledWith('test');
    });

    it('should delegate getTimedEvents()', () => {
      const service = createService();
      mockInstance.getTimedEvents.mockReturnValue(['evt1']);
      expect(service.getTimedEvents()).toEqual(['evt1']);
    });

    it('should delegate getEventDuration()', () => {
      const service = createService();
      expect(service.getEventDuration('test')).toBe(1500);
    });
  });

  describe('Debug & Utilities', () => {
    it('should delegate setDebugMode()', () => {
      const service = createService();
      service.setDebugMode(true);
      expect(mockInstance.setDebugMode).toHaveBeenCalledWith(true);
    });

    it('should delegate isDebugMode()', () => {
      const service = createService();
      expect(service.isDebugMode()).toBe(false);
    });

    it('should delegate shutdown()', () => {
      const service = createService();
      service.shutdown();
      expect(mockInstance.shutdown).toHaveBeenCalled();
    });
  });

  describe('Plugin System', () => {
    it('should delegate use()', () => {
      const service = createService();
      const plugin = { name: 'test', setup: vi.fn() };
      service.use(plugin);
      expect(mockInstance.use).toHaveBeenCalledWith(plugin);
    });

    it('should delegate getPlugins()', () => {
      const service = createService();
      expect(service.getPlugins()).toEqual(['page-view', 'click-tracking']);
    });
  });
});

describe('Service does NOT expose internal methods', () => {
  it('should not have bot detection methods', () => {
    const service = angularExports.KitbaseAnalyticsService.prototype;
    expect((service as any).isBot).toBeUndefined();
    expect((service as any).getBotDetectionResult).toBeUndefined();
    expect((service as any).redetectBot).toBeUndefined();
    expect((service as any).isBotBlockingActive).toBeUndefined();
  });

  it('should not have queue methods', () => {
    const service = angularExports.KitbaseAnalyticsService.prototype;
    expect((service as any).getQueueStats).toBeUndefined();
    expect((service as any).flushQueue).toBeUndefined();
    expect((service as any).clearQueue).toBeUndefined();
  });
});

describe('re-exports from core', () => {
  it('should re-export error classes', () => {
    expect(angularExports.KitbaseError).toBeDefined();
    expect(angularExports.ValidationError).toBeDefined();
    expect(angularExports.ApiError).toBeDefined();
    expect(angularExports.AuthenticationError).toBeDefined();
    expect(angularExports.TimeoutError).toBeDefined();
  });

  it('should re-export bot detection utilities', () => {
    expect(angularExports.detectBot).toBeDefined();
    expect(typeof angularExports.isBot).toBe('function');
  });

  it('should re-export plugin classes', () => {
    expect(angularExports.PageViewPlugin).toBeDefined();
    expect(angularExports.ScrollDepthPlugin).toBeDefined();
    expect(angularExports.WebVitalsPlugin).toBeDefined();
    expect(angularExports.FrustrationPlugin).toBeDefined();
  });

  it('should re-export init and getInstance', () => {
    expect(angularExports.init).toBeDefined();
    expect(angularExports.getInstance).toBeDefined();
  });
});
