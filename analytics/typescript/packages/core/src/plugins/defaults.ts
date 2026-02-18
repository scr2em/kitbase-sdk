import type { AnalyticsConfig } from '../types-lite.js';
import type { KitbasePlugin } from './types.js';
import { PageViewPlugin } from './page-view.js';
import { OutboundLinksPlugin } from './outbound-links.js';
import { ClickTrackingPlugin } from './click-tracking.js';
import { ScrollDepthPlugin } from './scroll-depth.js';
import { VisibilityPlugin } from './visibility.js';
import { WebVitalsPlugin } from './web-vitals.js';
import { FrustrationPlugin } from './frustration.js';

/**
 * Create the default set of plugins based on analytics configuration.
 * Reads config flags and instantiates only the enabled plugins.
 */
export function createDefaultPlugins(config?: AnalyticsConfig): KitbasePlugin[] {
  const plugins: KitbasePlugin[] = [];

  if (config?.autoTrackPageViews !== false) {
    plugins.push(new PageViewPlugin());
  }
  if (config?.autoTrackOutboundLinks !== false) {
    plugins.push(new OutboundLinksPlugin());
  }
  if (config?.autoTrackClicks !== false) {
    plugins.push(new ClickTrackingPlugin());
  }
  if (config?.autoTrackScrollDepth !== false) {
    plugins.push(new ScrollDepthPlugin());
  }
  if (config?.autoTrackVisibility !== false) {
    plugins.push(new VisibilityPlugin());
  }
  if (config?.autoTrackWebVitals === true) {
    plugins.push(new WebVitalsPlugin());
  }
  if (config?.autoDetectFrustration !== false) {
    plugins.push(new FrustrationPlugin());
  }

  return plugins;
}
