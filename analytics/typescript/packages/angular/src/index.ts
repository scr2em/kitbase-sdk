/**
 * Angular integration for Kitbase Analytics SDK
 *
 * Provides an Angular service for easy integration with Angular applications.
 * No Angular decorators are used — the service is provided via a factory function,
 * making it compatible with AOT compilation without requiring ng-packagr.
 *
 * @example
 * ```typescript
 * // main.ts or app.config.ts (standalone)
 * import { provideKitbaseAnalytics } from '@kitbase/analytics-angular';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideKitbaseAnalytics({ token: 'your-api-key' }),
 *   ],
 * });
 *
 * // component.ts
 * import { KitbaseAnalyticsService } from '@kitbase/analytics-angular';
 *
 * @Component({ ... })
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
  InjectionToken,
  Provider,
  makeEnvironmentProviders,
  EnvironmentProviders,
} from '@angular/core';
import {
  KitbaseAnalytics,
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
} from '@kitbase/analytics';

// Re-export types from core
export type {
  KitbaseConfig,
  TrackOptions,
  TrackResponse,
  PageViewOptions,
  RevenueOptions,
  IdentifyOptions,
  Tags,
  TagValue,
  AnalyticsConfig,
  PrivacyConfig,
};

/**
 * Injection token for the KitbaseAnalytics configuration
 */
const KITBASE_CONFIG = new InjectionToken<KitbaseConfig>('KITBASE_CONFIG');

/**
 * Injection token for the KitbaseAnalyticsService instance.
 * Use this with `inject(KitbaseAnalyticsService)` in your components.
 */
export const KitbaseAnalyticsService = new InjectionToken<KitbaseAnalyticsServiceImpl>(
  'KitbaseAnalyticsService',
);

/**
 * KitbaseAnalytics service for Angular applications.
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
export class KitbaseAnalyticsServiceImpl {
  private kitbase: KitbaseAnalytics;

  constructor(config: KitbaseConfig) {
    this.kitbase = new KitbaseAnalytics(config);
  }

  /**
   * Get the underlying KitbaseAnalytics instance for advanced usage
   */
  getInstance(): KitbaseAnalytics {
    return this.kitbase;
  }

  /**
   * Shutdown the client and cleanup resources
   */
  shutdown(): void {
    this.kitbase.shutdown();
  }

  // ============================================================
  // Event Tracking
  // ============================================================

  /**
   * Track a custom event
   */
  track(options: TrackOptions): Promise<TrackResponse | void> {
    return this.kitbase.track(options);
  }

  /**
   * Track a page view
   */
  trackPageView(options?: PageViewOptions): Promise<TrackResponse | void> {
    return this.kitbase.trackPageView(options);
  }

  /**
   * Track a revenue event
   */
  trackRevenue(options: RevenueOptions): Promise<TrackResponse | void> {
    return this.kitbase.trackRevenue(options);
  }

  /**
   * Track an outbound link click
   */
  trackOutboundLink(options: { url: string; text?: string }): Promise<TrackResponse | void> {
    return this.kitbase.trackOutboundLink(options);
  }

  /**
   * Track a click on an interactive element
   */
  trackClick(tags: Tags): Promise<TrackResponse | void> {
    return this.kitbase.trackClick(tags);
  }

  // ============================================================
  // User Identification
  // ============================================================

  /**
   * Identify a user
   */
  identify(options: IdentifyOptions): Promise<void> {
    return this.kitbase.identify(options);
  }

  /**
   * Get the current user ID
   */
  getUserId(): string | null {
    return this.kitbase.getUserId();
  }

  /**
   * Reset user identity
   */
  reset(): void {
    this.kitbase.reset();
  }

  // ============================================================
  // Super Properties
  // ============================================================

  /**
   * Register super properties (included with every event)
   */
  register(properties: Tags): void {
    this.kitbase.register(properties);
  }

  /**
   * Register super properties only if not already set
   */
  registerOnce(properties: Tags): void {
    this.kitbase.registerOnce(properties);
  }

  /**
   * Remove a super property
   */
  unregister(key: string): void {
    this.kitbase.unregister(key);
  }

  /**
   * Get all super properties
   */
  getSuperProperties(): Tags {
    return this.kitbase.getSuperProperties();
  }

  /**
   * Clear all super properties
   */
  clearSuperProperties(): void {
    this.kitbase.clearSuperProperties();
  }

  // ============================================================
  // Time Events
  // ============================================================

  /**
   * Start timing an event
   */
  timeEvent(eventName: string): void {
    this.kitbase.timeEvent(eventName);
  }

  /**
   * Cancel a timed event
   */
  cancelTimeEvent(eventName: string): void {
    this.kitbase.cancelTimeEvent(eventName);
  }

  /**
   * Get all timed events
   */
  getTimedEvents(): string[] {
    return this.kitbase.getTimedEvents();
  }

  /**
   * Get duration of a timed event
   */
  getEventDuration(eventName: string): number | null {
    return this.kitbase.getEventDuration(eventName);
  }

  // ============================================================
  // Privacy & Consent
  // ============================================================

  /**
   * Opt out of tracking
   */
  optOut(): Promise<void> {
    return this.kitbase.optOut();
  }

  /**
   * Opt in to tracking
   */
  optIn(): void {
    this.kitbase.optIn();
  }

  /**
   * Check if tracking is opted out
   */
  isOptedOut(): boolean {
    return this.kitbase.isOptedOut();
  }

  /**
   * Check if user has consented
   */
  hasConsent(): boolean {
    return this.kitbase.hasConsent();
  }

  // ============================================================
  // Debug & Utilities
  // ============================================================

  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.kitbase.setDebugMode(enabled);
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugMode(): boolean {
    return this.kitbase.isDebugMode();
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
  const providers: Provider[] = [
    {
      provide: KITBASE_CONFIG,
      useValue: config,
    },
    {
      provide: KitbaseAnalyticsService,
      useFactory: () => new KitbaseAnalyticsServiceImpl(config),
    },
  ];

  return makeEnvironmentProviders(providers);
}
