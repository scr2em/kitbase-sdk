import type { KitbasePlugin, PluginContext } from './types.js';
import { findClickableElement, buildCssSelector } from './utils.js';

const ANALYTICS_CHANNEL = '__analytics';

const RAGE_CLICK_THRESHOLD = 3;
const RAGE_CLICK_WINDOW_MS = 1000;
const RAGE_CLICK_RADIUS_PX = 30;
const DEAD_CLICK_TIMEOUT_MS = 1000;

export class FrustrationPlugin implements KitbasePlugin {
  readonly name = 'frustration';
  private ctx!: PluginContext;
  private rageClickBuffer: Array<{ time: number; x: number; y: number; target: Element }> = [];
  private deadClickObserver: MutationObserver | null = null;
  private deadClickTimeout: ReturnType<typeof setTimeout> | null = null;
  private clickListener: ((e: MouseEvent) => void) | null = null;

  setup(ctx: PluginContext): void | false {
    if (typeof window === 'undefined') return false;
    this.ctx = ctx;

    this.clickListener = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;

      const now = Date.now();

      // --- Rage Click Detection ---
      this.rageClickBuffer.push({ time: now, x: event.clientX, y: event.clientY, target });

      // Prune clicks older than the time window
      this.rageClickBuffer = this.rageClickBuffer.filter(
        (c) => now - c.time < RAGE_CLICK_WINDOW_MS,
      );

      if (this.rageClickBuffer.length >= RAGE_CLICK_THRESHOLD) {
        const first = this.rageClickBuffer[0]!;
        const allNearby = this.rageClickBuffer.every(
          (c) => Math.hypot(c.x - first.x, c.y - first.y) < RAGE_CLICK_RADIUS_PX,
        );

        if (allNearby) {
          const element = findClickableElement(event) || target;
          const clickCount = this.rageClickBuffer.length;
          this.rageClickBuffer = []; // reset after emitting

          ctx.track({
            channel: ANALYTICS_CHANNEL,
            event: 'rage_click',
            tags: {
              __path: window.location.pathname,
              __tag: element.tagName.toLowerCase(),
              __id: element.id || '',
              __class: element.className && typeof element.className === 'string' ? element.className : '',
              __text: (element.textContent || '').trim().slice(0, 100),
              __selector: buildCssSelector(element),
              __click_count: clickCount,
            },
          }).catch((err) => ctx.log('Failed to track rage click', err));
          return; // skip dead click check after rage click
        }
      }

      // --- Dead Click Detection ---
      const clickedElement = findClickableElement(event);
      if (!clickedElement) return;

      // Clear any pending dead click check
      if (this.deadClickTimeout !== null) {
        clearTimeout(this.deadClickTimeout);
        this.deadClickTimeout = null;
      }
      if (this.deadClickObserver) {
        this.deadClickObserver.disconnect();
      }

      let mutationDetected = false;

      this.deadClickObserver = new MutationObserver(() => {
        mutationDetected = true;
      });

      this.deadClickObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      this.deadClickTimeout = setTimeout(() => {
        if (this.deadClickObserver) {
          this.deadClickObserver.disconnect();
          this.deadClickObserver = null;
        }

        if (!mutationDetected) {
          ctx.track({
            channel: ANALYTICS_CHANNEL,
            event: 'dead_click',
            tags: {
              __path: window.location.pathname,
              __tag: clickedElement.tagName.toLowerCase(),
              __id: clickedElement.id || '',
              __class: clickedElement.className && typeof clickedElement.className === 'string' ? clickedElement.className : '',
              __text: (clickedElement.textContent || '').trim().slice(0, 100),
              __selector: buildCssSelector(clickedElement),
            },
          }).catch((err) => ctx.log('Failed to track dead click', err));
        }
      }, DEAD_CLICK_TIMEOUT_MS);
    };

    document.addEventListener('click', this.clickListener, true);
    ctx.log('Frustration signal detection enabled');
  }

  teardown(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener, true);
      this.clickListener = null;
    }
    if (this.deadClickObserver) {
      this.deadClickObserver.disconnect();
      this.deadClickObserver = null;
    }
    if (this.deadClickTimeout !== null) {
      clearTimeout(this.deadClickTimeout);
      this.deadClickTimeout = null;
    }
    this.rageClickBuffer = [];
  }
}
