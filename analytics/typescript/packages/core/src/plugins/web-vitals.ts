import type { KitbasePlugin, PluginContext } from './types.js';
import type { Tags } from '../types-lite.js';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

const ANALYTICS_CHANNEL = '__analytics';

export class WebVitalsPlugin implements KitbasePlugin {
  readonly name = 'web-vitals';
  private ctx!: PluginContext;
  private sent = false;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private beforeUnloadListener: (() => void) | null = null;
  private data: { lcp: number | null; cls: number | null; inp: number | null; fcp: number | null; ttfb: number | null } = {
    lcp: null, cls: null, inp: null, fcp: null, ttfb: null,
  };

  setup(ctx: PluginContext): void | false {
    if (typeof window === 'undefined') return false;
    this.ctx = ctx;

    const checkAndSend = () => {
      const { lcp, cls, inp, fcp, ttfb } = this.data;
      if (lcp !== null && cls !== null && inp !== null && fcp !== null && ttfb !== null) {
        this.sendWebVitals();
      }
    };

    onLCP((metric) => {
      this.data.lcp = metric.value;
      ctx.log('Web Vital collected', { name: 'LCP', value: metric.value });
      checkAndSend();
    });

    onCLS((metric) => {
      this.data.cls = metric.value;
      ctx.log('Web Vital collected', { name: 'CLS', value: metric.value });
      checkAndSend();
    });

    onINP((metric) => {
      this.data.inp = metric.value;
      ctx.log('Web Vital collected', { name: 'INP', value: metric.value });
      checkAndSend();
    });

    onFCP((metric) => {
      this.data.fcp = metric.value;
      ctx.log('Web Vital collected', { name: 'FCP', value: metric.value });
      checkAndSend();
    });

    onTTFB((metric) => {
      this.data.ttfb = metric.value;
      ctx.log('Web Vital collected', { name: 'TTFB', value: metric.value });
      checkAndSend();
    });

    // Safety timeout — send whatever we have after 30s
    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.sendWebVitals();
    }, 30_000);

    // Also send on beforeunload if not already sent
    this.beforeUnloadListener = () => {
      this.sendWebVitals();
    };
    window.addEventListener('beforeunload', this.beforeUnloadListener);

    ctx.log('Web Vitals tracking enabled');
  }

  teardown(): void {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.sendWebVitals();
    if (this.beforeUnloadListener) {
      window.removeEventListener('beforeunload', this.beforeUnloadListener);
      this.beforeUnloadListener = null;
    }
  }

  private sendWebVitals(): void {
    if (this.sent) return;

    const { lcp, cls, inp, fcp, ttfb } = this.data;

    // Don't send if no metrics were collected at all
    if (lcp === null && cls === null && inp === null && fcp === null && ttfb === null) return;

    this.sent = true;

    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const tags: Tags = {};
    if (lcp !== null) tags.__lcp = lcp;
    if (cls !== null) tags.__cls = cls;
    if (inp !== null) tags.__inp = inp;
    if (fcp !== null) tags.__fcp = fcp;
    if (ttfb !== null) tags.__ttfb = ttfb;

    this.ctx.log('Sending Web Vitals', tags);

    this.ctx.track({
      channel: ANALYTICS_CHANNEL,
      event: 'web_vitals',
      tags,
    }).catch((err) => this.ctx.log('Failed to track web vitals', err));
  }
}
