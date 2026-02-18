import type { TrackOptions, TrackResponse, Tags, AnalyticsConfig } from '../types-lite.js';

export interface KitbasePlugin {
  readonly name: string;
  setup(ctx: PluginContext): void | false;
  teardown(): void;
  methods?: Record<string, (...args: any[]) => any>;
}

export interface PluginContext {
  track(options: TrackOptions): Promise<TrackResponse | void>;
  readonly config: Readonly<AnalyticsConfig>;
  readonly debug: boolean;
  log(message: string, data?: unknown): void;
  isOptedOut(): boolean;
  isBotBlockingActive(): boolean;
  findClickableElement(event: MouseEvent): Element | null;
  readonly CLICKABLE_SELECTOR: string;
  getRootDomain(hostname: string): string;
  isSameRootDomain(host1: string, host2: string): boolean;
  getUtmParams(): Tags;
}
