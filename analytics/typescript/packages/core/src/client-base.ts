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

const DEFAULT_BASE_URL = 'https://api.kitbase.dev';
const TIMEOUT = 30000;
const DEFAULT_OPT_OUT_STORAGE_KEY = '_ka_opt_out';
const ANALYTICS_CHANNEL = '__analytics';

/**
 * Simple storage interface used internally for opt-out persistence
 */
interface SimpleStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Get the default storage (localStorage in browser, or null)
 */
function getDefaultStorage(): SimpleStorage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

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

  // Analytics tracking
  protected autoTrackPageViews: boolean;
  protected autoTrackOutboundLinks: boolean;
  protected autoTrackClicks: boolean;
  protected autoTrackScrollDepth: boolean;
  protected userId: string | null = null;
  protected clickListenerAdded = false;
  protected clickTrackingListenerAdded = false;

  // Scroll depth tracking
  protected scrollTrackingActive = false;
  protected maxScrollDepth = 0;
  private scrollListener: (() => void) | null = null;
  private beforeUnloadListener: (() => void) | null = null;
  private scrollRafScheduled = false;

  // Bot detection
  protected botDetectionConfig: BotDetectionConfig;
  protected botDetectionResult: BotDetectionResult | null = null;

  // Privacy & Consent
  protected optedOut: boolean = false;
  protected optOutStorageKey: string;
  private optOutStorage: SimpleStorage | null;

  // Client-side session tracking
  private clientSessionId: string | null = null;
  private lastActivityAt: number = 0;
  private static readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  constructor(config: KitbaseLiteConfig) {
    if (!config.token) {
      throw new ValidationError('API token is required', 'token');
    }

    this.token = config.token;
    // Remove trailing slashes to prevent double-slash in URLs
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.debugMode = config.debug ?? false;

    // Initialize analytics configuration
    this.autoTrackPageViews = config.analytics?.autoTrackPageViews ?? true;
    this.autoTrackOutboundLinks = config.analytics?.autoTrackOutboundLinks ?? true;
    this.autoTrackClicks = config.analytics?.autoTrackClicks ?? true;
    this.autoTrackScrollDepth = config.analytics?.autoTrackScrollDepth ?? true;

    // Auto-track pageviews if enabled
    if (this.autoTrackPageViews && typeof window !== 'undefined') {
      this.enableAutoPageViews();
    }

    // Setup outbound link tracking if enabled
    if (this.autoTrackOutboundLinks && typeof window !== 'undefined') {
      this.setupOutboundLinkTracking();
    }

    // Setup click tracking if enabled
    if (this.autoTrackClicks && typeof window !== 'undefined') {
      this.setupClickTracking();
    }

    // Setup scroll depth tracking if enabled
    if (this.autoTrackScrollDepth && typeof window !== 'undefined') {
      this.setupScrollDepthTracking();
    }

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

    // Initialize privacy/consent settings
    this.optOutStorageKey = config.privacy?.optOutStorageKey ?? DEFAULT_OPT_OUT_STORAGE_KEY;
    this.optOutStorage = getDefaultStorage();
    this.initializeOptOutState(config.privacy?.optOutByDefault ?? false);
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
   * @returns true if bots are being blocked from tracking
   */
  isBotBlockingActive(): boolean {
    return this.botDetectionConfig?.enabled === true && this.isBot();
  }

  // ============================================================
  // Privacy & Consent Management
  // ============================================================

  /**
   * Initialize opt-out state from storage or default
   */
  protected initializeOptOutState(optOutByDefault: boolean): void {
    if (this.optOutStorage) {
      const stored = this.optOutStorage.getItem(this.optOutStorageKey);
      if (stored !== null) {
        this.optedOut = stored === 'true';
        this.log('Opt-out state loaded from storage', { optedOut: this.optedOut });
        return;
      }
    }

    // Use default if no stored value
    this.optedOut = optOutByDefault;
    if (optOutByDefault) {
      this.log('Tracking opted out by default');
    }
  }

  /**
   * Opt out of tracking
   * When opted out, all tracking calls will be silently ignored.
   * The opt-out state is persisted to storage and survives page reloads.
   *
   * @example
   * ```typescript
   * // User clicks "Reject" on cookie consent banner
   * kitbase.optOut();
   * ```
   */
  optOut(): void {
    this.optedOut = true;

    // Persist to storage
    if (this.optOutStorage) {
      this.optOutStorage.setItem(this.optOutStorageKey, 'true');
    }

    this.log('User opted out of tracking');
  }

  /**
   * Opt back in to tracking
   * Re-enables tracking after a previous opt-out.
   * The opt-in state is persisted to storage.
   *
   * @example
   * ```typescript
   * // User clicks "Accept" on cookie consent banner
   * kitbase.optIn();
   * ```
   */
  optIn(): void {
    this.optedOut = false;

    // Persist to storage
    if (this.optOutStorage) {
      this.optOutStorage.setItem(this.optOutStorageKey, 'false');
    }

    this.log('User opted in to tracking');
  }

  /**
   * Check if tracking is currently opted out
   *
   * @returns true if the user has opted out of tracking
   *
   * @example
   * ```typescript
   * if (kitbase.isOptedOut()) {
   *   console.log('Tracking is disabled');
   * }
   * ```
   */
  isOptedOut(): boolean {
    return this.optedOut;
  }

  /**
   * Check if tracking has user consent (not opted out)
   * Convenience method - inverse of isOptedOut()
   *
   * @returns true if the user has consented to tracking
   *
   * @example
   * ```typescript
   * if (kitbase.hasConsent()) {
   *   // Show personalized content
   * }
   * ```
   */
  hasConsent(): boolean {
    return !this.optedOut;
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

    // Check if user has opted out of tracking
    if (this.optedOut) {
      this.log('Event skipped - user opted out', { event: options.event });
      return;
    }

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
  // Analytics
  // ============================================================

  /**
   * Setup outbound link click tracking
   */
  protected setupOutboundLinkTracking(): void {
    if (typeof window === 'undefined' || this.clickListenerAdded) return;

    const handleClick = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest?.('a');
      if (link) {
        this.handleLinkClick(link as HTMLAnchorElement);
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const link = (event.target as Element)?.closest?.('a');
        if (link) {
          this.handleLinkClick(link as HTMLAnchorElement);
        }
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);

    this.clickListenerAdded = true;
    this.log('Outbound link tracking enabled');
  }

  /**
   * Handle link click for outbound tracking
   */
  protected handleLinkClick(link: HTMLAnchorElement): void {
    if (!link.href) return;

    try {
      const linkUrl = new URL(link.href);

      // Only track http/https links
      if (linkUrl.protocol !== 'http:' && linkUrl.protocol !== 'https:') {
        return;
      }

      const currentHost = window.location.hostname;
      const linkHost = linkUrl.hostname;

      // Skip if same host
      if (linkHost === currentHost) {
        return;
      }

      // Skip if same root domain (e.g., blog.example.com -> example.com)
      if (this.isSameRootDomain(currentHost, linkHost)) {
        return;
      }

      // Track as outbound link
      this.trackOutboundLink({
        url: link.href,
        text: link.textContent?.trim() || '',
      }).catch((err) => this.log('Failed to track outbound link', err));
    } catch {
      // Invalid URL, skip
    }
  }

  /**
   * Get root domain from hostname (e.g., blog.example.com -> example.com)
   */
  protected getRootDomain(hostname: string): string {
    const parts = hostname.replace(/^www\./, '').split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return hostname;
  }

  /**
   * Check if two hostnames share the same root domain
   */
  protected isSameRootDomain(host1: string, host2: string): boolean {
    return this.getRootDomain(host1) === this.getRootDomain(host2);
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
    return this.track({
      channel: ANALYTICS_CHANNEL,
      event: 'outbound_link',
      tags: {
        __url: options.url,
        __text: options.text || '',
      },
    });
  }

  /**
   * CSS selector matching interactive elements for click tracking.
   * Includes standard HTML elements and common web component tag names
   * (Ionic, Material, Shoelace, etc.) that wrap native controls in Shadow DOM.
   */
  private static readonly CLICKABLE_SELECTOR = [
    'a', 'button', 'input', 'select', 'textarea',
    '[role="button"]', '[role="link"]', '[role="menuitem"]', '[role="tab"]',
  ].join(', ');

  /**
   * Find the nearest clickable element from a click event.
   * Uses `composedPath()` to traverse through Shadow DOM boundaries,
   * then falls back to `closest()` on the event target.
   */
  private findClickableElement(event: MouseEvent): Element | null {
    // composedPath() gives the full path including shadow DOM internals
    const path = event.composedPath?.() as Element[] | undefined;

    if (path) {
      for (const node of path) {
        if (!(node instanceof Element)) continue;
        // Stop at the document/shadow root level
        if (node === document.documentElement) break;
        if (node.matches(KitbaseAnalytics.CLICKABLE_SELECTOR)) return node;
      }
    }

    // Fallback for browsers without composedPath
    const target = event.target as Element | null;
    if (!target?.closest) return null;
    return target.closest(KitbaseAnalytics.CLICKABLE_SELECTOR);
  }

  /**
   * Setup click tracking on interactive elements via event delegation
   */
  protected setupClickTracking(): void {
    if (typeof window === 'undefined' || this.clickTrackingListenerAdded) return;

    document.addEventListener('click', (event: MouseEvent) => {
      const element = this.findClickableElement(event);
      if (!element) return;

      // Skip outbound links — already handled by outbound link tracking
      if (this.autoTrackOutboundLinks && element.tagName === 'A') {
        const link = element as HTMLAnchorElement;
        try {
          const linkUrl = new URL(link.href);
          if (
            (linkUrl.protocol === 'http:' || linkUrl.protocol === 'https:') &&
            linkUrl.hostname !== window.location.hostname &&
            !this.isSameRootDomain(window.location.hostname, linkUrl.hostname)
          ) {
            return;
          }
        } catch {
          // Invalid URL, continue with click tracking
        }
      }

      const tag = element.tagName.toLowerCase();
      const id = element.id || '';
      const className = element.className && typeof element.className === 'string' ? element.className : '';
      const text = (element.textContent || '').trim().slice(0, 100);
      const href = (element as HTMLAnchorElement).href || '';

      const path = window.location.pathname;

      this.trackClick({ __tag: tag, __id: id, __class: className, __text: text, __href: href, __path: path }).catch(
        (err) => this.log('Failed to track click', err),
      );
    });

    this.clickTrackingListenerAdded = true;
    this.log('Click tracking enabled');
  }

  /**
   * Track a click on an interactive element
   */
  async trackClick(tags: Tags): Promise<TrackResponse | void> {
    return this.track({
      channel: ANALYTICS_CHANNEL,
      event: 'click',
      tags,
    });
  }

  /**
   * Setup scroll depth tracking
   */
  protected setupScrollDepthTracking(): void {
    if (typeof window === 'undefined' || this.scrollTrackingActive) return;

    this.scrollListener = () => {
      if (this.scrollRafScheduled) return;
      this.scrollRafScheduled = true;
      requestAnimationFrame(() => {
        this.scrollRafScheduled = false;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const viewportHeight = window.innerHeight;
        const documentHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        );
        if (documentHeight <= 0) return;
        const depth = Math.min(100, Math.round(((scrollTop + viewportHeight) / documentHeight) * 100));
        if (depth > this.maxScrollDepth) {
          this.maxScrollDepth = depth;
        }
      });
    };

    this.beforeUnloadListener = () => {
      this.flushScrollDepth();
    };

    window.addEventListener('scroll', this.scrollListener, { passive: true });
    window.addEventListener('beforeunload', this.beforeUnloadListener);

    // Also fire on SPA navigation (pushState / popstate)
    const originalPushState = history.pushState;
    const self = this;
    history.pushState = function (...args) {
      self.flushScrollDepth();
      return originalPushState.apply(this, args);
    };

    window.addEventListener('popstate', () => {
      this.flushScrollDepth();
    });

    this.scrollTrackingActive = true;
    this.log('Scroll depth tracking enabled');
  }

  /**
   * Flush scroll depth and reset for next page
   */
  protected flushScrollDepth(): void {
    if (this.maxScrollDepth > 0) {
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      this.trackScrollDepth(this.maxScrollDepth, path);
      this.maxScrollDepth = 0;
    }
  }

  /**
   * Track scroll depth
   */
  protected trackScrollDepth(depth: number, path: string): void {
    this.track({
      channel: ANALYTICS_CHANNEL,
      event: 'scroll_depth',
      tags: {
        __depth: depth,
        __path: path,
      },
    }).catch((err) => this.log('Failed to track scroll depth', err));
  }

  /**
   * Get UTM parameters from URL
   */
  protected getUtmParams(): Tags {
    if (typeof window === 'undefined') return {};

    const params = new URLSearchParams(window.location.search);
    const utmParams: Tags = {};

    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    for (const key of utmKeys) {
      const value = params.get(key);
      if (value) {
        utmParams[`__${key}`] = value;
      }
    }

    return utmParams;
  }

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
  async trackPageView(options: PageViewOptions = {}): Promise<TrackResponse | void> {
    const path = options.path ?? (typeof window !== 'undefined' ? window.location.pathname : '');
    const title = options.title ?? (typeof document !== 'undefined' ? document.title : '');
    const referrer = options.referrer ?? (typeof document !== 'undefined' ? document.referrer : '');

    return this.track({
      channel: ANALYTICS_CHANNEL,
      event: 'screen_view',
      tags: {
        __path: path,
        __title: title,
        __referrer: referrer,
        ...this.getUtmParams(),
        ...(options.tags ?? {}),
      },
    });
  }

  /**
   * Enable automatic page view tracking
   * Intercepts browser history changes (pushState, replaceState, popstate)
   *
   * @example
   * ```typescript
   * kitbase.enableAutoPageViews();
   * // Now all route changes will automatically be tracked
   * ```
   */
  enableAutoPageViews(): void {
    if (typeof window === 'undefined') {
      this.log('Auto page views not available in non-browser environment');
      return;
    }

    // Track initial page view
    this.trackPageView().catch((err) => this.log('Failed to track initial page view', err));

    // Intercept pushState
    const originalPushState = history.pushState.bind(history);
    history.pushState = (...args) => {
      originalPushState(...args);
      this.trackPageView().catch((err) => this.log('Failed to track page view (pushState)', err));
    };

    // Intercept replaceState
    const originalReplaceState = history.replaceState.bind(history);
    history.replaceState = (...args) => {
      originalReplaceState(...args);
      // Don't track replaceState as it's usually not a navigation
    };

    // Listen to popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      this.trackPageView().catch((err) => this.log('Failed to track page view (popstate)', err));
    });

    this.log('Auto page view tracking enabled');
  }

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
    // Check if user has opted out of tracking
    if (this.optedOut) {
      this.log('Identify skipped - user opted out', { userId: options.userId });
      return;
    }

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

    // Cleanup scroll depth tracking
    if (this.scrollTrackingActive) {
      this.flushScrollDepth();
      if (this.scrollListener) {
        window.removeEventListener('scroll', this.scrollListener);
        this.scrollListener = null;
      }
      if (this.beforeUnloadListener) {
        window.removeEventListener('beforeunload', this.beforeUnloadListener);
        this.beforeUnloadListener = null;
      }
      this.scrollTrackingActive = false;
    }

    this.log('Shutdown complete');
  }
}
