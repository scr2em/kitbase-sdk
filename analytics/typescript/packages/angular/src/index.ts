/**
 * Angular integration for Kitbase Analytics SDK
 *
 * Provides an Angular service and optional module for easy integration
 * with Angular applications.
 *
 * @example
 * ```typescript
 * // app.config.ts (standalone)
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
 * @Component({ ... })
 * export class MyComponent {
 *   constructor(private kitbase: KitbaseAnalyticsService) {}
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
  Injectable,
  InjectionToken,
  Inject,
  Optional,
  OnDestroy,
  Provider,
  makeEnvironmentProviders,
  EnvironmentProviders,
  inject,
  DestroyRef,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  KitbaseAnalytics,
  type KitbaseConfig,
  type TrackOptions,
  type TrackResponse,
  type PageViewOptions,
  type RevenueOptions,
  type IdentifyOptions,
  type Tags,
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
};

/**
 * Injection token for the KitbaseAnalytics configuration
 */
export const KITBASE_CONFIG = new InjectionToken<KitbaseConfig>('KITBASE_CONFIG');

/**
 * KitbaseAnalytics Analytics service for Angular applications.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-button',
 *   template: '<button (click)="onClick()">Click me</button>',
 * })
 * export class ButtonComponent {
 *   constructor(private kitbase: KitbaseAnalyticsService) {}
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
@Injectable({ providedIn: 'root' })
export class KitbaseAnalyticsService implements OnDestroy {
  private kitbase: KitbaseAnalytics;

  constructor(@Inject(KITBASE_CONFIG) config: KitbaseConfig) {
    this.kitbase = new KitbaseAnalytics(config);
  }

  ngOnDestroy(): void {
    this.kitbase.shutdown();
  }

  /**
   * Get the underlying KitbaseAnalytics instance for advanced usage
   */
  getInstance(): KitbaseAnalytics {
    return this.kitbase;
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

  /**
   * Check if current visitor is a bot
   */
  isBot(): boolean {
    return this.kitbase.isBot();
  }

  /**
   * Enable automatic page view tracking
   */
  enableAutoPageViews(): void {
    this.kitbase.enableAutoPageViews();
  }
}

// ============================================================
// Provider Function (Standalone API)
// ============================================================

/**
 * Configuration options for the KitbaseAnalytics provider
 */
export interface KitbaseAnalyticsProviderOptions extends KitbaseConfig {
  /**
   * Enable automatic page view tracking on route changes
   * @default false
   */
  trackRouteChanges?: boolean;
}

/**
 * Provide KitbaseAnalytics analytics for standalone Angular applications.
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { ApplicationConfig } from '@angular/core';
 * import { provideKitbaseAnalytics } from '@kitbase/analytics-angular';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideKitbaseAnalytics({
 *       token: 'your-api-key',
 *       debug: true,
 *       trackRouteChanges: true,
 *     }),
 *   ],
 * };
 * ```
 */
export function provideKitbaseAnalytics(options: KitbaseAnalyticsProviderOptions): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: KITBASE_CONFIG,
      useValue: options,
    },
    KitbaseAnalyticsService,
  ];

  return makeEnvironmentProviders(providers);
}

// ============================================================
// Route Change Tracker (Functional Guard/Initializer)
// ============================================================

/**
 * Initialize automatic route tracking.
 * Call this in your app initializer or root component.
 *
 * @example
 * ```typescript
 * // app.component.ts
 * import { Component, inject } from '@angular/core';
 * import { initRouteTracking } from '@kitbase/analytics-angular';
 *
 * @Component({ ... })
 * export class AppComponent {
 *   constructor() {
 *     initRouteTracking();
 *   }
 * }
 * ```
 */
export function initRouteTracking(): void {
  const kitbase = inject(KitbaseAnalyticsService);
  const router = inject(Router, { optional: true });
  const destroyRef = inject(DestroyRef);

  if (!router) {
    console.warn('[KitbaseAnalytics] Router not available, route tracking disabled');
    return;
  }

  const subscription = router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe((event) => {
      const navEnd = event as NavigationEnd;
      kitbase.trackPageView({
        path: navEnd.urlAfterRedirects,
      });
    });

  destroyRef.onDestroy(() => {
    subscription.unsubscribe();
  });
}

/**
 * Directive to track clicks on elements.
 *
 * @example
 * ```html
 * <button kitbaseTrack="Button Clicked" [kitbaseTrackTags]="{ button_id: 'cta' }">
 *   Click me
 * </button>
 * ```
 */
// Note: Directive implementation would require @angular/core Directive decorator
// For simplicity, this is documented but users can implement click tracking
// using (click)="kitbase.track({...})" pattern
