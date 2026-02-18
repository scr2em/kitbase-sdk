import type { KitbasePlugin, PluginContext } from './types.js';

const ANALYTICS_CHANNEL = '__analytics';

export class ScrollDepthPlugin implements KitbasePlugin {
  readonly name = 'scroll-depth';
  private ctx!: PluginContext;
  private maxScrollDepth = 0;
  private scrollListener: (() => void) | null = null;
  private beforeUnloadListener: (() => void) | null = null;
  private scrollRafScheduled = false;

  setup(ctx: PluginContext): void | false {
    if (typeof window === 'undefined') return false;
    this.ctx = ctx;

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

    // SPA navigation (pushState / popstate)
    const originalPushState = history.pushState;
    const self = this;
    history.pushState = function (...args) {
      self.flushScrollDepth();
      return originalPushState.apply(this, args);
    };

    window.addEventListener('popstate', () => {
      this.flushScrollDepth();
    });

    ctx.log('Scroll depth tracking enabled');
  }

  teardown(): void {
    this.flushScrollDepth();
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
    if (this.beforeUnloadListener) {
      window.removeEventListener('beforeunload', this.beforeUnloadListener);
      this.beforeUnloadListener = null;
    }
  }

  private flushScrollDepth(): void {
    if (this.maxScrollDepth > 0) {
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      this.ctx.track({
        channel: ANALYTICS_CHANNEL,
        event: 'scroll_depth',
        tags: {
          __depth: this.maxScrollDepth,
          __path: path,
        },
      }).catch((err) => this.ctx.log('Failed to track scroll depth', err));
      this.maxScrollDepth = 0;
    }
  }
}
