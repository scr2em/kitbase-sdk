import type { KitbasePlugin, PluginContext } from './types.js';
import type { Tags, TrackResponse } from '../types-lite.js';

const ANALYTICS_CHANNEL = '__analytics';

export class ClickTrackingPlugin implements KitbasePlugin {
  readonly name = 'click-tracking';
  private ctx!: PluginContext;
  private clickListener: ((event: MouseEvent) => void) | null = null;

  setup(ctx: PluginContext): void | false {
    if (typeof window === 'undefined') return false;
    this.ctx = ctx;

    this.clickListener = (event: MouseEvent) => {
      const target = event.target as Element | null;

      // data-kb-track-click — user-defined click events via data attributes
      const annotated = target?.closest?.('[data-kb-track-click]');
      if (annotated) {
        const eventName = annotated.getAttribute('data-kb-track-click');
        if (eventName) {
          const channel = annotated.getAttribute('data-kb-click-channel') || 'engagement';
          ctx.track({
            channel,
            event: eventName,
            tags: {
              __path: window.location.pathname,
            },
          }).catch((err) => ctx.log('Failed to track data-attribute click', err));
          return; // skip generic click tracking for annotated elements
        }
      }

      const element = ctx.findClickableElement(event);
      if (!element) return;

      // Skip outbound links — already handled by outbound link tracking
      if (ctx.config.autoTrackOutboundLinks !== false) {
        const elHref = (element as HTMLAnchorElement).href || element.getAttribute('href') || '';
        if (elHref) {
          try {
            const linkUrl = new URL(elHref, window.location.origin);
            if (
              (linkUrl.protocol === 'http:' || linkUrl.protocol === 'https:') &&
              linkUrl.hostname !== window.location.hostname &&
              !ctx.isSameRootDomain(window.location.hostname, linkUrl.hostname)
            ) {
              return;
            }
          } catch {
            // Invalid URL, continue with click tracking
          }
        }
      }

      const tag = element.tagName.toLowerCase();
      const id = element.id || '';
      const className = element.className && typeof element.className === 'string' ? element.className : '';
      const text = (element.textContent || '').trim().slice(0, 100);
      const href = (element as HTMLAnchorElement).href || element.getAttribute('href') || '';
      const path = window.location.pathname;

      this.trackClick({ __tag: tag, __id: id, __class: className, __text: text, __href: href, __path: path }).catch(
        (err) => ctx.log('Failed to track click', err),
      );
    };

    document.addEventListener('click', this.clickListener);
    ctx.log('Click tracking enabled');
  }

  teardown(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
      this.clickListener = null;
    }
  }

  get methods() {
    return {
      trackClick: (tags: Tags): Promise<TrackResponse | void> =>
        this.trackClick(tags),
    };
  }

  private async trackClick(tags: Tags): Promise<TrackResponse | void> {
    return this.ctx.track({
      channel: ANALYTICS_CHANNEL,
      event: 'click',
      tags,
    });
  }
}
