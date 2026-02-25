import type {
  TrackOptions,
  TrackResponse,
  LogPayload,
  Tags,
  PageViewOptions,
  RevenueOptions,
  IdentifyOptions,
} from './types.js';
import type { KitbaseLiteConfig } from './types-lite.js';
import {
  ApiError,
  AuthenticationError,
  TimeoutError,
  ValidationError,
} from './errors.js';
import {
  detectBot,
  DEFAULT_BOT_DETECTION_CONFIG,
  type BotDetectionConfig,
  type BotDetectionResult,
} from './botDetection.js';
import type { KitbasePlugin, PluginContext } from './plugins/types.js';
import {
  findClickableElement,
  CLICKABLE_SELECTOR,
  getRootDomain,
  isSameRootDomain,
  getUtmParams,
} from './plugins/utils.js';

const DEFAULT_BASE_URL = 'https://api.kitbase.dev';
const TIMEOUT = 30000;
const ANALYTICS_CHANNEL = '__analytics';

/**
 * Kitbase base client for tracking events (lite version without offline queue)
 *
 * This is a lightweight version of the Kitbase client that sends events
 * directly to the API without offline queueing support.
 *
 * @example
 * ```typescript
 * import { Kitbase } from '@kitbase/analytics/lite';
 *
 * const kitbase = new Kitbase({
 *   token: '<YOUR_API_KEY>',
 *   debug: true,
 * });
 *
 * // Register super properties (included in all events)
 * kitbase.register({ app_version: '2.1.0', platform: 'web' });
 *
 * // Track events
 * await kitbase.track({
 *   channel: 'payments',
 *   event: 'Page Viewed',
 *   icon: '👀',
 * });
 * ```
 */
export class KitbaseAnalytics {
  protected readonly token: string;
  protected readonly baseUrl: string;

  // Super properties (memory-only, merged into all events)
  protected superProperties: Tags = {};

  // Time event tracking
  protected timedEvents: Map<string, number> = new Map();

  // Debug mode
  protected debugMode: boolean;

  // Analytics config (stored for PluginContext)
  protected analyticsConfig: KitbaseLiteConfig['analytics'];

  protected userId: string | null = null;

  // Bot detection
  protected botDetectionConfig: BotDetectionConfig;
  protected botDetectionResult: BotDetectionResult | null = null;

  // Client-side session tracking
  private clientSessionId: string | null = null;
  private lastActivityAt: number = 0;
  private static readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  // Plugin system
  private _plugins: Map<string, KitbasePlugin> = new Map();
  private _pluginContext: PluginContext | null = null;

  constructor(config: KitbaseLiteConfig, defaultPlugins?: KitbasePlugin[]) {
    if (!config.token) {
      throw new ValidationError('API token is required', 'token');
    }

    this.token = config.token;
    // Remove trailing slashes to prevent double-slash in URLs
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.debugMode = config.debug ?? false;

    // Store analytics config for plugin context
    this.analyticsConfig = config.analytics;

    // Initialize bot detection
    this.botDetectionConfig = {
      ...DEFAULT_BOT_DETECTION_CONFIG,
      ...config.botDetection,
    };

    if (this.botDetectionConfig.enabled) {
      this.botDetectionResult = detectBot(this.botDetectionConfig);
      if (this.botDetectionResult.isBot) {
        this.log('Bot detected', {
          reason: this.botDetectionResult.reason,
          checks: this.botDetectionResult.checks,
        });
      } else {
        this.log('Bot detection enabled, no bot detected');
      }
    }

    // Register default plugins
    if (defaultPlugins) {
      for (const plugin of defaultPlugins) {
        this.use(plugin);
      }
    }
  }

  // ============================================================
  // Plugin System
  // ============================================================

  /**
   * Register a plugin
   *
   * @param plugin - The plugin instance to register
   *
   * @example
   * ```typescript
   * kitbase.use(new WebVitalsPlugin());
   * ```
   */
  use(plugin: KitbasePlugin): void {
    if (this._plugins.has(plugin.name)) {
      this.log(`Plugin "${plugin.name}" already registered`);
      return;
    }

    const ctx = this.getPluginContext();
    const result = plugin.setup(ctx);
    if (result === false) {
      this.log(`Plugin "${plugin.name}" declined to activate`);
      return;
    }

    this._plugins.set(plugin.name, plugin);

    // Install public methods from plugin
    const methods = plugin.methods;
    if (methods) {
      for (const [name, fn] of Object.entries(methods)) {
        (this as any)[name] = fn;
      }
    }

    this.log(`Plugin "${plugin.name}" registered`);
  }

  /**
   * Get the names of all registered plugins
   */
  getPlugins(): string[] {
    return Array.from(this._plugins.keys());
  }

  private getPluginContext(): PluginContext {
    if (this._pluginContext) return this._pluginContext;

    this._pluginContext = {
      track: (options: TrackOptions) => this.track(options),
      config: Object.freeze({
        autoTrackPageViews: this.analyticsConfig?.autoTrackPageViews,
        autoTrackOutboundLinks: this.analyticsConfig?.autoTrackOutboundLinks,
        autoTrackClicks: this.analyticsConfig?.autoTrackClicks,
        autoTrackScrollDepth: this.analyticsConfig?.autoTrackScrollDepth,
        autoTrackVisibility: this.analyticsConfig?.autoTrackVisibility,
        autoTrackWebVitals: this.analyticsConfig?.autoTrackWebVitals,
        autoDetectFrustration: this.analyticsConfig?.autoDetectFrustration,
      }),
      debug: this.debugMode,
      log: (message: string, data?: unknown) => this.log(message, data),
      isBotBlockingActive: () => this.isBotBlockingActive(),
      findClickableElement,
      CLICKABLE_SELECTOR,
      getRootDomain,
      isSameRootDomain,
      getUtmParams,
    };

    return this._pluginContext;
  }

  // ============================================================
  // Debug Mode
  // ============================================================

  /**
   * Enable or disable debug mode
   * When enabled, all SDK operations are logged to the console
   *
   * @param enabled - Whether to enable debug mode
   *
   * @example
   * ```typescript
   * kitbase.setDebugMode(true);
   * // All events and operations will now be logged
   * ```
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    this.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugMode(): boolean {
    return this.debugMode;
  }

  /**
   * Internal logging function
   */
  protected log(message: string, data?: unknown): void {
    if (!this.debugMode) return;

    const prefix = '[Kitbase]';
    if (data !== undefined) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }

  // ============================================================
  // Super Properties
  // ============================================================

  /**
   * Register super properties that will be included with every event
   * These properties are stored in memory only and reset on page reload
   *
   * @param properties - Properties to register
   *
   * @example
   * ```typescript
   * kitbase.register({
   *   app_version: '2.1.0',
   *   platform: 'web',
   *   environment: 'production',
   * });
   * ```
   */
  register(properties: Tags): void {
    this.superProperties = { ...this.superProperties, ...properties };
    this.log('Super properties registered', properties);
  }

  /**
   * Register super properties only if they haven't been set yet
   * Useful for setting default values that shouldn't override existing ones
   *
   * @param properties - Properties to register if not already set
   *
   * @example
   * ```typescript
   * kitbase.registerOnce({ first_visit: new Date().toISOString() });
   * ```
   */
  registerOnce(properties: Tags): void {
    const newProps: Tags = {};
    for (const [key, value] of Object.entries(properties)) {
      if (!(key in this.superProperties)) {
        newProps[key] = value;
      }
    }
    if (Object.keys(newProps).length > 0) {
      this.superProperties = { ...this.superProperties, ...newProps };
      this.log('Super properties registered (once)', newProps);
    }
  }

  /**
   * Remove a super property
   *
   * @param key - The property key to remove
   *
   * @example
   * ```typescript
   * kitbase.unregister('platform');
   * ```
   */
  unregister(key: string): void {
    if (key in this.superProperties) {
      delete this.superProperties[key];
      this.log('Super property removed', { key });
    }
  }

  /**
   * Get all registered super properties
   *
   * @returns A copy of the current super properties
   *
   * @example
   * ```typescript
   * const props = kitbase.getSuperProperties();
   * console.log(props); // { app_version: '2.1.0', platform: 'web' }
   * ```
   */
  getSuperProperties(): Tags {
    return { ...this.superProperties };
  }

  /**
   * Clear all super properties
   *
   * @example
   * ```typescript
   * kitbase.clearSuperProperties();
   * ```
   */
  clearSuperProperties(): void {
    this.superProperties = {};
    this.log('Super properties cleared');
  }

  // ============================================================
  // Time Events (Duration Tracking)
  // ============================================================

  /**
   * Start timing an event
   * When the same event is tracked later, a $duration property (in seconds)
   * will automatically be included
   *
   * @param eventName - The name of the event to time
   *
   * @example
   * ```typescript
   * kitbase.timeEvent('Video Watched');
   * // ... user watches video ...
   * await kitbase.track({
   *   channel: 'engagement',
   *   event: 'Video Watched',
   *   tags: { video_id: '123' }
   * });
   * // Event will include $duration: 45.2 (seconds)
   * ```
   */
  timeEvent(eventName: string): void {
    this.timedEvents.set(eventName, Date.now());
    this.log('Timer started', { event: eventName });
  }

  /**
   * Cancel a timed event without tracking it
   *
   * @param eventName - The name of the event to cancel timing for
   *
   * @example
   * ```typescript
   * kitbase.timeEvent('Checkout Flow');
   * // User abandons checkout
   * kitbase.cancelTimeEvent('Checkout Flow');
   * ```
   */
  cancelTimeEvent(eventName: string): void {
    if (this.timedEvents.has(eventName)) {
      this.timedEvents.delete(eventName);
      this.log('Timer cancelled', { event: eventName });
    }
  }

  /**
   * Get all currently timed events
   *
   * @returns Array of event names that are currently being timed
   *
   * @example
   * ```typescript
   * const timedEvents = kitbase.getTimedEvents();
   * console.log(timedEvents); // ['Video Watched', 'Checkout Flow']
   * ```
   */
  getTimedEvents(): string[] {
    return Array.from(this.timedEvents.keys());
  }

  /**
   * Get the duration of a timed event (without stopping it)
   * @internal
   *
   * @param eventName - The name of the event
   * @returns Duration in seconds, or null if not being timed
   */
  getEventDuration(eventName: string): number | null {
    const startTime = this.timedEvents.get(eventName);
    if (startTime === undefined) return null;
    return (Date.now() - startTime) / 1000;
  }

  // ============================================================
  // Bot Detection
  // ============================================================

  /**
   * Check if the current visitor is detected as a bot
   *
   * @internal This is an internal API and may change without notice.
   * @returns true if bot detected, false otherwise
   *
   * @example
   * ```typescript
   * if (kitbase.isBot()) {
   *   console.log('Bot detected, tracking disabled');
   * }
   * ```
   */
  isBot(): boolean {
    if (!this.botDetectionConfig?.enabled) {
      return false;
    }

    // Re-run detection if not yet done
    if (!this.botDetectionResult) {
      this.botDetectionResult = detectBot(this.botDetectionConfig);
    }

    return this.botDetectionResult.isBot;
  }

  /**
   * Get detailed bot detection result
   *
   * @internal This is an internal API and may change without notice.
   * @returns Bot detection result with detailed checks, or null if detection not enabled
   *
   * @example
   * ```typescript
   * const result = kitbase.getBotDetectionResult();
   * if (result?.isBot) {
   *   console.log('Bot detected:', result.reason);
   *   console.log('Checks:', result.checks);
   * }
   * ```
   */
  getBotDetectionResult(): BotDetectionResult | null {
    if (!this.botDetectionConfig.enabled) {
      return null;
    }

    // Re-run detection if not yet done
    if (!this.botDetectionResult) {
      this.botDetectionResult = detectBot(this.botDetectionConfig);
    }

    return this.botDetectionResult;
  }

  /**
   * Force re-run bot detection
   * Useful if you want to check again after page state changes
   *
   * @internal This is an internal API and may change without notice.
   * @returns Updated bot detection result
   *
   * @example
   * ```typescript
   * const result = kitbase.redetectBot();
   * console.log('Is bot:', result.isBot);
   * ```
   */
  redetectBot(): BotDetectionResult {
    this.botDetectionResult = detectBot(this.botDetectionConfig);
    this.log('Bot detection re-run', {
      isBot: this.botDetectionResult.isBot,
      reason: this.botDetectionResult.reason,
    });
    return this.botDetectionResult;
  }

  /**
   * Check if bot blocking is currently active
   * When bot detection is enabled and a bot is detected, all events are blocked.
   *
   * @internal This is an internal API and may change without notice.
   * @returns true if bots are being blocked from tracking
   */
  isBotBlockingActive(): boolean {
    return this.botDetectionConfig?.enabled === true && this.isBot();
  }

  // ============================================================
  // Client Session Tracking
  // ============================================================

  /**
   * Get or create a client-side session ID.
   * Rotates the session after 30 minutes of inactivity.
   * @internal
   */
  protected getClientSessionId(): string {
    const now = Date.now();
    if (
      !this.clientSessionId ||
      (this.lastActivityAt > 0 && now - this.lastActivityAt > KitbaseAnalytics.SESSION_TIMEOUT_MS)
    ) {
      this.clientSessionId = KitbaseAnalytics.generateUUID();
      this.log('New client session started', { sessionId: this.clientSessionId });
    }
    this.lastActivityAt = now;
    return this.clientSessionId;
  }

  /**
   * Generate a UUID v4, with fallback for environments where
   * crypto.randomUUID() is not available (older WebViews, Ionic).
   */
  private static generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback using crypto.getRandomValues (wider browser/WebView support)
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      // Set version 4 and variant bits
      bytes[6] = (bytes[6]! & 0x0f) | 0x40;
      bytes[8] = (bytes[8]! & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    // Last resort fallback (Math.random - not cryptographically secure but functional)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // ============================================================
  // Track Event
  // ============================================================

  /**
   * Track an event
   *
   * Events are sent directly to the API. For offline queueing support,
   * use the full Kitbase client instead.
   *
   * @param options - Event tracking options
   * @returns Promise resolving to the track response, or void if tracking is blocked
   * @throws {ValidationError} When required fields are missing
   * @throws {AuthenticationError} When the API key is invalid
   * @throws {ApiError} When the API returns an error
   * @throws {TimeoutError} When the request times out
   */
  async track(options: TrackOptions): Promise<TrackResponse | void> {
    this.validateTrackOptions(options);

    // Check if bot blocking is active
    if (this.isBotBlockingActive()) {
      this.log('Event skipped - bot detected', { event: options.event });
      return;
    }

    // Calculate duration if this event was being timed
    let duration: number | undefined;
    const startTime = this.timedEvents.get(options.event);
    if (startTime !== undefined) {
      duration = (Date.now() - startTime) / 1000;
      this.timedEvents.delete(options.event);
      this.log('Timer stopped', { event: options.event, duration });
    }

    // Merge super properties with event tags (event tags take precedence)
    const mergedTags: Tags = {
      ...this.superProperties,
      ...(options.tags ?? {}),
      ...(duration !== undefined ? { $duration: duration } : {}),
    };

    const payload: LogPayload = {
      channel: options.channel,
      event: options.event,
      client_timestamp: Date.now(),
      client_session_id: this.getClientSessionId(),
      ...(options.user_id && { user_id: options.user_id }),
      ...(options.icon && { icon: options.icon }),
      ...(options.notify !== undefined && { notify: options.notify }),
      ...(options.description && { description: options.description }),
      ...(Object.keys(mergedTags).length > 0 && { tags: mergedTags }),
    };

    this.log('Track', { event: options.event, payload });

    // Send directly to API
    const response = await this.sendRequest<TrackResponse>('/sdk/v1/logs', payload);
    this.log('Event sent successfully', { id: response.id });
    return response;
  }

  protected validateTrackOptions(options: TrackOptions): void {
    if (!options.event) {
      throw new ValidationError('Event is required', 'event');
    }
  }

  /**
   * Send a request to the API
   */
  protected async sendRequest<T>(endpoint: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sdk-key': `${this.token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await this.parseResponseBody(response);

        if (response.status === 401) {
          throw new AuthenticationError();
        }

        throw new ApiError(
          this.getErrorMessage(errorBody, response.statusText),
          response.status,
          errorBody,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError();
      }

      throw error;
    }
  }

  protected async parseResponseBody(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  protected getErrorMessage(body: unknown, fallback: string): string {
    if (body && typeof body === 'object' && 'message' in body) {
      return String((body as { message: unknown }).message);
    }
    if (body && typeof body === 'object' && 'error' in body) {
      return String((body as { error: unknown }).error);
    }
    return fallback;
  }

  // ============================================================
  // Analytics — Stub methods (overridden by plugins via methods)
  // ============================================================

  /**
   * Track a page view
   *
   * @param options - Page view options
   * @returns Promise resolving to the track response
   *
   * @example
   * ```typescript
   * // Track current page
   * await kitbase.trackPageView();
   *
   * // Track with custom path
   * await kitbase.trackPageView({ path: '/products/123', title: 'Product Details' });
   * ```
   */
  async trackPageView(options?: PageViewOptions): Promise<TrackResponse | void> {
    this.log('trackPageView() called but page-view plugin is not registered');
  }

  /**
   * Track a click on an interactive element
   */
  async trackClick(tags: Tags): Promise<TrackResponse | void> {
    this.log('trackClick() called but click-tracking plugin is not registered');
  }

  /**
   * Track an outbound link click
   *
   * @param options - Outbound link options
   * @returns Promise resolving to the track response
   *
   * @example
   * ```typescript
   * await kitbase.trackOutboundLink({
   *   url: 'https://example.com',
   *   text: 'Visit Example',
   * });
   * ```
   */
  async trackOutboundLink(options: { url: string; text?: string }): Promise<TrackResponse | void> {
    this.log('trackOutboundLink() called but outbound-links plugin is not registered');
  }

  // ============================================================
  // Analytics — Revenue & Identity (non-plugin)
  // ============================================================

  /**
   * Track a revenue event
   *
   * @param options - Revenue options
   * @returns Promise resolving to the track response
   *
   * @example
   * ```typescript
   * // Track a $19.99 purchase
   * await kitbase.trackRevenue({
   *   amount: 1999,
   *   currency: 'USD',
   *   tags: { product_id: 'prod_123', plan: 'premium' },
   * });
   * ```
   */
  async trackRevenue(options: RevenueOptions): Promise<TrackResponse | void> {
    return this.track({
      channel: ANALYTICS_CHANNEL,
      event: 'revenue',
      user_id: options.user_id ?? this.userId ?? undefined,
      tags: {
        __revenue: options.amount,
        __currency: options.currency ?? 'USD',
        ...(options.tags ?? {}),
      },
    });
  }

  /**
   * Identify a user
   * Sets the user identity on the server.
   * Call this when a user signs up or logs in.
   *
   * @param options - Identify options
   * @returns Promise that resolves when the identity is set
   *
   * @example
   * ```typescript
   * await kitbase.identify({
   *   userId: 'user_123',
   *   traits: { email: 'user@example.com', plan: 'premium' },
   * });
   * ```
   */
  async identify(options: IdentifyOptions): Promise<void> {
    this.userId = options.userId;

    // Register user traits as super properties
    if (options.traits) {
      this.register({
        __user_id: options.userId,
        ...options.traits,
      });
    } else {
      this.register({ __user_id: options.userId });
    }

    // Call the identify endpoint
    try {
      const response = await fetch(`${this.baseUrl}/sdk/v1/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sdk-key': this.token,
        },
        body: JSON.stringify({
          user_id: options.userId,
          traits: options.traits,
        }),
      });

      if (!response.ok) {
        this.log('Identify API call failed', { status: response.status });
      } else {
        this.log('Identity set on server', {
          userId: options.userId,
        });
      }
    } catch (err) {
      this.log('Failed to call identify endpoint', err);
    }

    this.log('User identified', { userId: options.userId });
  }

  /**
   * Get the current user ID (set via identify)
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Reset the user identity
   * Call this when a user logs out
   *
   * @example
   * ```typescript
   * kitbase.reset();
   * ```
   */
  reset(): void {
    // Clear user ID
    this.userId = null;

    // Clear client session
    this.clientSessionId = null;
    this.lastActivityAt = 0;

    // Clear super properties
    this.clearSuperProperties();

    this.log('User reset complete');
  }

  // ============================================================
  // Cleanup
  // ============================================================

  /**
   * Shutdown the client and cleanup resources
   * Call this when you're done using the client to stop timers and close connections
   *
   * @example
   * ```typescript
   * kitbase.shutdown();
   * ```
   */
  shutdown(): void {
    this.log('Shutting down');

    // Clear timed events
    this.timedEvents.clear();

    // Teardown plugins in reverse order
    const pluginNames = Array.from(this._plugins.keys()).reverse();
    for (const name of pluginNames) {
      const plugin = this._plugins.get(name)!;
      try {
        plugin.teardown();
        this.log(`Plugin "${name}" torn down`);
      } catch (err) {
        this.log(`Plugin "${name}" teardown failed`, err);
      }
    }
    this._plugins.clear();
    this._pluginContext = null;

    this.log('Shutdown complete');
  }
}
