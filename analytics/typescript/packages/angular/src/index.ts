/**
 * Angular integration for Kitbase Analytics SDK
 *
 * Two ways to use:
 *
 * **1. Direct usage — just call `init()`:**
 * ```typescript
 * import { init } from '@kitbase/analytics-angular';
 *
 * const kitbase = init({ token: 'your-api-key' });
 * kitbase.track({ channel: 'ui', event: 'Button Clicked' });
 * ```
 *
 * **2. Angular DI — use `provideKitbaseAnalytics()` + `inject()`:**
 * ```typescript
 * // app.config.ts
 * import { provideKitbaseAnalytics } from '@kitbase/analytics-angular';
 *
 * export const appConfig = {
 *   providers: [
 *     provideKitbaseAnalytics({ token: 'your-api-key' }),
 *   ],
 * };
 *
 * // component.ts
 * import { KitbaseAnalyticsService } from '@kitbase/analytics-angular';
 *
 * export class MyComponent {
 *   private kitbase = inject(KitbaseAnalyticsService);
 *
 *   onClick() {
 *     this.kitbase.track({ channel: 'ui', event: 'Button Clicked' });
 *   }
 * }
 * ```
 *
 * @packageDocumentation
 */

import {
  Provider,
  makeEnvironmentProviders,
  EnvironmentProviders,
} from '@angular/core';
import {
  init,
  getInstance,
  type KitbaseAnalytics,
  type KitbaseConfig,
  type TrackOptions,
  type TrackResponse,
  type PageViewOptions,
  type RevenueOptions,
  type IdentifyOptions,
  type Tags,
  type TagValue,
  type AnalyticsConfig,
  type PrivacyConfig,
  type KitbasePlugin,
} from '@kitbase/analytics';

// Re-export everything from core
export * from '@kitbase/analytics';

/**
 * KitbaseAnalytics service for Angular applications.
 *
 * This abstract class serves as both the DI token and the type definition.
 * Use `inject(KitbaseAnalyticsService)` in your components.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-button',
 *   template: '<button (click)="onClick()">Click me</button>',
 * })
 * export class ButtonComponent {
 *   private kitbase = inject(KitbaseAnalyticsService);
 *
 *   onClick() {
 *     this.kitbase.track({
 *       channel: 'ui',
 *       event: 'Button Clicked',
 *       tags: { button_id: 'cta' },
 *     });
 *   }
 * }
 * ```
 */
export abstract class KitbaseAnalyticsService {
  /** Get the underlying KitbaseAnalytics instance for advanced usage */
  abstract getInstance(): KitbaseAnalytics;

  /** Shutdown the client and cleanup resources */
  abstract shutdown(): void;

  // Event Tracking
  abstract track(options: TrackOptions): Promise<TrackResponse | void>;
  abstract trackPageView(options?: PageViewOptions): Promise<TrackResponse | void>;
  abstract trackRevenue(options: RevenueOptions): Promise<TrackResponse | void>;
  abstract trackOutboundLink(options: { url: string; text?: string }): Promise<TrackResponse | void>;
  abstract trackClick(tags: Tags): Promise<TrackResponse | void>;

  // User Identification
  abstract identify(options: IdentifyOptions): Promise<void>;
  abstract getUserId(): string | null;
  abstract reset(): void;

  // Super Properties
  abstract register(properties: Tags): void;
  abstract registerOnce(properties: Tags): void;
  abstract unregister(key: string): void;
  abstract getSuperProperties(): Tags;
  abstract clearSuperProperties(): void;

  // Time Events
  abstract timeEvent(eventName: string): void;
  abstract cancelTimeEvent(eventName: string): void;
  abstract getTimedEvents(): string[];
  abstract getEventDuration(eventName: string): number | null;

  // Privacy & Consent
  abstract optOut(): Promise<void>;
  abstract optIn(): void;
  abstract isOptedOut(): boolean;
  abstract hasConsent(): boolean;

  // Debug & Utilities
  abstract setDebugMode(enabled: boolean): void;
  abstract isDebugMode(): boolean;

  // Plugin System
  abstract use(plugin: KitbasePlugin): void;
  abstract getPlugins(): string[];
}

class KitbaseAnalyticsServiceImpl extends KitbaseAnalyticsService {
  private kitbase: KitbaseAnalytics;

  constructor(config: KitbaseConfig) {
    super();
    this.kitbase = init(config);
  }

  getInstance(): KitbaseAnalytics {
    return this.kitbase;
  }

  shutdown(): void {
    this.kitbase.shutdown();
  }

  // Event Tracking
  track(options: TrackOptions): Promise<TrackResponse | void> {
    return this.kitbase.track(options);
  }

  trackPageView(options?: PageViewOptions): Promise<TrackResponse | void> {
    return this.kitbase.trackPageView(options);
  }

  trackRevenue(options: RevenueOptions): Promise<TrackResponse | void> {
    return this.kitbase.trackRevenue(options);
  }

  trackOutboundLink(options: { url: string; text?: string }): Promise<TrackResponse | void> {
    return this.kitbase.trackOutboundLink(options);
  }

  trackClick(tags: Tags): Promise<TrackResponse | void> {
    return this.kitbase.trackClick(tags);
  }

  // User Identification
  identify(options: IdentifyOptions): Promise<void> {
    return this.kitbase.identify(options);
  }

  getUserId(): string | null {
    return this.kitbase.getUserId();
  }

  reset(): void {
    this.kitbase.reset();
  }

  // Super Properties
  register(properties: Tags): void {
    this.kitbase.register(properties);
  }

  registerOnce(properties: Tags): void {
    this.kitbase.registerOnce(properties);
  }

  unregister(key: string): void {
    this.kitbase.unregister(key);
  }

  getSuperProperties(): Tags {
    return this.kitbase.getSuperProperties();
  }

  clearSuperProperties(): void {
    this.kitbase.clearSuperProperties();
  }

  // Time Events
  timeEvent(eventName: string): void {
    this.kitbase.timeEvent(eventName);
  }

  cancelTimeEvent(eventName: string): void {
    this.kitbase.cancelTimeEvent(eventName);
  }

  getTimedEvents(): string[] {
    return this.kitbase.getTimedEvents();
  }

  getEventDuration(eventName: string): number | null {
    return this.kitbase.getEventDuration(eventName);
  }

  // Privacy & Consent
  optOut(): Promise<void> {
    return this.kitbase.optOut();
  }

  optIn(): void {
    this.kitbase.optIn();
  }

  isOptedOut(): boolean {
    return this.kitbase.isOptedOut();
  }

  hasConsent(): boolean {
    return this.kitbase.hasConsent();
  }

  // Debug & Utilities
  setDebugMode(enabled: boolean): void {
    this.kitbase.setDebugMode(enabled);
  }

  isDebugMode(): boolean {
    return this.kitbase.isDebugMode();
  }

  // Plugin System
  use(plugin: KitbasePlugin): void {
    this.kitbase.use(plugin);
  }

  getPlugins(): string[] {
    return this.kitbase.getPlugins();
  }
}

// ============================================================
// Provider Function (Standalone API)
// ============================================================

/**
 * Provide KitbaseAnalytics analytics for standalone Angular applications.
 *
 * Page views, clicks, outbound links, and scroll depth are tracked automatically
 * by the core SDK (it intercepts history.pushState/popstate), so no additional
 * Angular Router integration is needed.
 *
 * @example
 * ```typescript
 * // main.ts
 * import { provideKitbaseAnalytics } from '@kitbase/analytics-angular';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideKitbaseAnalytics({
 *       token: 'your-api-key',
 *       debug: true,
 *     }),
 *   ],
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With offline mode — events are queued locally in IndexedDB
 * // and automatically sent when back online.
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideKitbaseAnalytics({
 *       token: 'your-api-key',
 *       offline: {
 *         enabled: true,
 *         maxQueueSize: 1000,    // max events to store (default: 1000)
 *         flushInterval: 30000,  // flush every 30s (default: 30000)
 *         flushBatchSize: 50,    // events per batch (default: 50)
 *         maxRetries: 3,         // retry attempts (default: 3)
 *       },
 *     }),
 *   ],
 * });
 * ```
 */
export function provideKitbaseAnalytics(config: KitbaseConfig): EnvironmentProviders {
  // Create the instance eagerly so auto-tracking (clicks, page views,
  // scroll depth, outbound links) is set up at bootstrap time.
  const instance = new KitbaseAnalyticsServiceImpl(config);

  const providers: Provider[] = [
    {
      provide: KitbaseAnalyticsService,
      useValue: instance,
    },
  ];

  return makeEnvironmentProviders(providers);
}
