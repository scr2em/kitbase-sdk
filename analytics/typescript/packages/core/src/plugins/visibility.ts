import type { KitbasePlugin, PluginContext } from './types.js';

export class VisibilityPlugin implements KitbasePlugin {
  readonly name = 'visibility';
  private ctx!: PluginContext;
  private active = false;
  private visibilityObservers: Map<number, IntersectionObserver> = new Map();
  private visibilityMutationObserver: MutationObserver | null = null;
  private visibilityData: Map<Element, { visibleSince: number | null; totalMs: number; event: string; channel: string }> = new Map();
  private beforeUnloadListener: (() => void) | null = null;
  private popstateListener: (() => void) | null = null;

  setup(ctx: PluginContext): void | false {
    if (typeof window === 'undefined') return false;
    if (typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return false;
    this.ctx = ctx;
    this.active = true;

    // Scan existing DOM elements
    this.scanForVisibilityElements();

    // Watch for dynamically added/removed elements
    this.visibilityMutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof Element) {
            this.observeVisibilityElement(node);
            for (const el of Array.from(node.querySelectorAll('[data-kb-track-visibility]'))) {
              this.observeVisibilityElement(el);
            }
          }
        }
        for (const node of Array.from(mutation.removedNodes)) {
          if (node instanceof Element) {
            this.flushVisibilityForElement(node);
            for (const el of Array.from(node.querySelectorAll('[data-kb-track-visibility]'))) {
              this.flushVisibilityForElement(el);
            }
          }
        }
      }
    });

    this.visibilityMutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Flush on beforeunload
    this.beforeUnloadListener = () => {
      this.flushAllVisibilityEvents();
    };
    window.addEventListener('beforeunload', this.beforeUnloadListener);

    // SPA navigation (pushState / popstate)
    const originalPushState = history.pushState;
    const self = this;
    history.pushState = function (...args) {
      if (self.active) self.flushAllVisibilityEvents();
      return originalPushState.apply(this, args);
    };

    this.popstateListener = () => {
      if (this.active) this.flushAllVisibilityEvents();
    };
    window.addEventListener('popstate', this.popstateListener);

    ctx.log('Visibility tracking enabled');
  }

  teardown(): void {
    this.active = false;
    this.flushAllVisibilityEvents();
    for (const observer of this.visibilityObservers.values()) {
      observer.disconnect();
    }
    this.visibilityObservers.clear();
    if (this.visibilityMutationObserver) {
      this.visibilityMutationObserver.disconnect();
      this.visibilityMutationObserver = null;
    }
    if (this.beforeUnloadListener) {
      window.removeEventListener('beforeunload', this.beforeUnloadListener);
      this.beforeUnloadListener = null;
    }
    if (this.popstateListener) {
      window.removeEventListener('popstate', this.popstateListener);
      this.popstateListener = null;
    }
    this.visibilityData.clear();
  }

  private scanForVisibilityElements(): void {
    for (const el of Array.from(document.querySelectorAll('[data-kb-track-visibility]'))) {
      this.observeVisibilityElement(el);
    }
  }

  private observeVisibilityElement(el: Element): void {
    const eventName = el.getAttribute('data-kb-track-visibility');
    if (!eventName || this.visibilityData.has(el)) return;

    const channel = el.getAttribute('data-kb-visibility-channel') || 'engagement';
    const threshold = parseFloat(el.getAttribute('data-kb-visibility-threshold') || '0.5');
    const clampedThreshold = Math.max(0, Math.min(1, isNaN(threshold) ? 0.5 : threshold));

    this.visibilityData.set(el, {
      visibleSince: null,
      totalMs: 0,
      event: eventName,
      channel,
    });

    const observer = this.getOrCreateObserver(clampedThreshold);
    observer.observe(el);
  }

  private getOrCreateObserver(threshold: number): IntersectionObserver {
    const key = Math.round(threshold * 100);

    let observer = this.visibilityObservers.get(key);
    if (observer) return observer;

    observer = new IntersectionObserver(
      (entries) => {
        const now = Date.now();
        for (const entry of entries) {
          const data = this.visibilityData.get(entry.target);
          if (!data) continue;

          if (entry.isIntersecting) {
            data.visibleSince = now;
          } else if (data.visibleSince !== null) {
            data.totalMs += now - data.visibleSince;
            data.visibleSince = null;
          }
        }
      },
      { threshold },
    );

    this.visibilityObservers.set(key, observer);
    return observer;
  }

  private flushVisibilityForElement(el: Element): void {
    const data = this.visibilityData.get(el);
    if (!data) return;

    if (data.visibleSince !== null) {
      data.totalMs += Date.now() - data.visibleSince;
      data.visibleSince = null;
    }

    if (data.totalMs > 0) {
      const durationMs = Math.round(data.totalMs);
      const durationSeconds = Math.round(durationMs / 1000);
      this.ctx.track({
        channel: data.channel,
        event: 'element_visible',
        tags: {
          element_name: data.event,
          duration_seconds: durationSeconds,
          duration_ms: durationMs,
        },
      }).catch((err) => this.ctx.log('Failed to track visibility event', err));
    }

    for (const observer of this.visibilityObservers.values()) {
      observer.unobserve(el);
    }
    this.visibilityData.delete(el);
  }

  private flushAllVisibilityEvents(): void {
    for (const [, data] of this.visibilityData.entries()) {
      if (data.visibleSince !== null) {
        data.totalMs += Date.now() - data.visibleSince;
        data.visibleSince = null;
      }

      if (data.totalMs > 0) {
        const durationMs = Math.round(data.totalMs);
        const durationSeconds = Math.round(durationMs / 1000);
        this.ctx.track({
          channel: data.channel,
          event: 'element_visible',
          tags: {
            element_name: data.event,
            duration_seconds: durationSeconds,
            duration_ms: durationMs,
          },
        }).catch((err) => this.ctx.log('Failed to track visibility event', err));
      }

      // Reset for next page / session
      data.totalMs = 0;
      data.visibleSince = null;
    }
  }
}
