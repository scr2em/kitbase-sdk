import type { KitbasePlugin, PluginContext } from './types.js';
import type { PageViewOptions, TrackResponse } from '../types-lite.js';
import { getUtmParams } from './utils.js';

const ANALYTICS_CHANNEL = '__analytics';

export class PageViewPlugin implements KitbasePlugin {
  readonly name = 'page-view';
  private ctx!: PluginContext;

  setup(ctx: PluginContext): void | false {
    if (typeof window === 'undefined') return false;
    this.ctx = ctx;

    // Track initial page view
    this.trackPageView().catch((err) => ctx.log('Failed to track initial page view', err));

    // Intercept pushState
    const originalPushState = history.pushState.bind(history);
    history.pushState = (...args) => {
      originalPushState(...args);
      this.trackPageView().catch((err) => ctx.log('Failed to track page view (pushState)', err));
    };

    // Intercept replaceState (preserve behavior, no tracking)
    const originalReplaceState = history.replaceState.bind(history);
    history.replaceState = (...args) => {
      originalReplaceState(...args);
    };

    // Listen to popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      this.trackPageView().catch((err) => ctx.log('Failed to track page view (popstate)', err));
    });

    ctx.log('Auto page view tracking enabled');
  }

  teardown(): void {
    // History monkey-patches can't be cleanly removed
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
