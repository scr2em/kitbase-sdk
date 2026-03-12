import type { KitbasePlugin, PluginContext } from './types.js';
import type { PageViewOptions, TrackResponse } from '../types-lite.js';
import { getUtmParams } from './utils.js';

const ANALYTICS_CHANNEL = '__analytics';

export class PageViewPlugin implements KitbasePlugin {
  readonly name = 'page-view';
  private ctx!: PluginContext;
  private active = false;
  private popstateListener: (() => void) | null = null;
  private pageshowListener: ((e: PageTransitionEvent) => void) | null = null;

  setup(ctx: PluginContext): void | false {
    if (typeof window === 'undefined') return false;
    this.ctx = ctx;
    this.active = true;

    // Defer initial page view so subclass constructors (e.g. offline queue) finish first
    Promise.resolve().then(() => {
      if (this.active) {
        this.trackPageView().catch((err) => ctx.log('Failed to track initial page view', err));
      }
    });

    // Intercept pushState
    const originalPushState = history.pushState.bind(history);
    history.pushState = (...args) => {
      originalPushState(...args);
      if (this.active) {
        this.trackPageView().catch((err) => ctx.log('Failed to track page view (pushState)', err));
      }
    };

    // Intercept replaceState (preserve behavior, no tracking)
    const originalReplaceState = history.replaceState.bind(history);
    history.replaceState = (...args) => {
      originalReplaceState(...args);
    };

    // Listen to popstate (browser back/forward)
    this.popstateListener = () => {
      if (this.active) {
        this.trackPageView().catch((err) => ctx.log('Failed to track page view (popstate)', err));
      }
    };
    window.addEventListener('popstate', this.popstateListener);

    // Listen to pageshow (bfcache restore on back/forward in MPAs)
    if (ctx.config.trackBfcacheRestore !== false) {
      this.pageshowListener = (e: PageTransitionEvent) => {
        if (e.persisted && this.active) {
          this.trackPageView().catch((err) => ctx.log('Failed to track page view (bfcache)', err));
        }
      };
      window.addEventListener('pageshow', this.pageshowListener);
    }

    ctx.log('Auto page view tracking enabled');
  }

  teardown(): void {
    this.active = false;
    if (this.popstateListener) {
      window.removeEventListener('popstate', this.popstateListener);
      this.popstateListener = null;
    }
    if (this.pageshowListener) {
      window.removeEventListener('pageshow', this.pageshowListener);
      this.pageshowListener = null;
    }
  }

  get methods() {
    return {
      trackPageView: (options?: PageViewOptions): Promise<TrackResponse | void> =>
        this.trackPageView(options),
    };
  }

  private async trackPageView(options: PageViewOptions = {}): Promise<TrackResponse | void> {
    const path = options.path ?? (typeof window !== 'undefined' ? window.location.pathname : '');
    const title = options.title ?? (typeof document !== 'undefined' ? document.title : '');
    const referrer = options.referrer ?? (typeof document !== 'undefined' ? document.referrer : '');

    return this.ctx.track({
      channel: ANALYTICS_CHANNEL,
      event: 'screen_view',
      tags: {
        __path: path,
        __title: title,
        __referrer: referrer,
        ...getUtmParams(),
        ...(options.tags ?? {}),
      },
    });
  }
}
