import type { KitbasePlugin, PluginContext } from './types.js';
import type { TrackResponse } from '../types-lite.js';

const ANALYTICS_CHANNEL = '__analytics';

export class OutboundLinksPlugin implements KitbasePlugin {
  readonly name = 'outbound-links';
  private ctx!: PluginContext;
  private clickListener: ((event: MouseEvent) => void) | null = null;
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;

  setup(ctx: PluginContext): void | false {
    if (typeof window === 'undefined') return false;
    this.ctx = ctx;

    this.clickListener = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest?.('a');
      if (link) {
        this.handleLinkClick(link as HTMLAnchorElement);
      }
    };

    this.keydownListener = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const link = (event.target as Element)?.closest?.('a');
        if (link) {
          this.handleLinkClick(link as HTMLAnchorElement);
        }
      }
    };

    document.addEventListener('click', this.clickListener);
    document.addEventListener('keydown', this.keydownListener);

    ctx.log('Outbound link tracking enabled');
  }

  teardown(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
      this.clickListener = null;
    }
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
  }

  get methods() {
    return {
      trackOutboundLink: (options: { url: string; text?: string }): Promise<TrackResponse | void> =>
        this.trackOutboundLink(options),
    };
  }

  private handleLinkClick(link: HTMLAnchorElement): void {
    if (!link.href) return;

    try {
      const linkUrl = new URL(link.href);

      if (linkUrl.protocol !== 'http:' && linkUrl.protocol !== 'https:') {
        return;
      }

      const currentHost = window.location.hostname;
      const linkHost = linkUrl.hostname;

      if (linkHost === currentHost) return;
      if (this.ctx.isSameRootDomain(currentHost, linkHost)) return;

      this.trackOutboundLink({
        url: link.href,
        text: link.textContent?.trim() || '',
      }).catch((err) => this.ctx.log('Failed to track outbound link', err));
    } catch {
      // Invalid URL, skip
    }
  }

  private async trackOutboundLink(options: { url: string; text?: string }): Promise<TrackResponse | void> {
    return this.ctx.track({
      channel: ANALYTICS_CHANNEL,
      event: 'outbound_link',
      tags: {
        __url: options.url,
        __text: options.text || '',
      },
    });
  }
}
