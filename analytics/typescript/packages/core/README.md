# @kitbase/analytics

Core Kitbase Analytics SDK for TypeScript and JavaScript. Framework-agnostic — works in any browser environment.

## Installation

```bash
npm install @kitbase/analytics
# or
pnpm add @kitbase/analytics
# or
yarn add @kitbase/analytics
```

## Quick Start

```typescript
import { Kitbase } from '@kitbase/analytics';

const kitbase = new Kitbase({
  token: 'your-api-key',
  debug: true,
});

// Track a custom event
await kitbase.track({
  channel: 'payments',
  event: 'Purchase Completed',
  tags: { product_id: 'prod_123', amount: 4999 },
});
```

### Lite Build

For a smaller bundle without offline queue support:

```typescript
import { KitbaseAnalytics } from '@kitbase/analytics/lite';

const kitbase = new KitbaseAnalytics({ token: 'your-api-key' });
```

### Script Tag (CDN)

```html
<script>
  window.KITBASE_CONFIG = { token: 'your-api-key' };
</script>
<script defer src="https://kitbase.dev/script.js"></script>
```

The script auto-initializes and exposes `window.kitbase` for tracking events:

```html
<script>
  window.kitbase.track({
    channel: 'web',
    event: 'Button Clicked',
    tags: { button_id: 'signup' },
  });
</script>
```

## Configuration

```typescript
const kitbase = new Kitbase({
  // Required
  token: 'your-api-key',

  // Optional
  debug: false,
  baseUrl: 'https://api.kitbase.dev',

  analytics: {
    autoTrackPageViews: true,      // track route changes automatically
    autoTrackOutboundLinks: true,  // track external link clicks
    autoTrackClicks: true,         // track button/link/input clicks + data-kb-track-click
    autoTrackScrollDepth: true,    // track max scroll depth per page
    autoTrackVisibility: true,     // track visibility duration via data attributes
  },

  privacy: {
    optOutByDefault: false,
    optOutStorageKey: '_ka_opt_out',
    clearQueueOnOptOut: true,
  },

  offline: {
    enabled: true,
    maxQueueSize: 1000,
    flushInterval: 30000,
    flushBatchSize: 50,
    maxRetries: 3,
  },

  botDetection: {
    enabled: false,
  },
});
```

## Auto-Tracked Events

All enabled by default. The SDK automatically tracks:

| Event | Channel | Trigger |
|-------|---------|---------|
| `screen_view` | `__analytics` | Page navigation (init, pushState, popstate) |
| `outbound_link` | `__analytics` | Click on external link |
| `click` | `__analytics` | Click on interactive element |
| `scroll_depth` | `__analytics` | Navigation / unload (max depth per page) |

Page views, clicks, outbound links, and scroll depth are tracked automatically. The SDK intercepts `history.pushState`/`popstate` for SPA support — no framework router integration needed.

## Data Attribute Events

Track events from HTML using data attributes — no JavaScript needed. Works in any framework or vanilla HTML.

### Click Tracking

Fire a named event when a user clicks an element:

```html
<!-- Basic -->
<button data-kb-track-click="CTA Clicked">Sign Up Now</button>

<!-- With custom channel -->
<button data-kb-track-click="Add to Cart" data-kb-click-channel="ecommerce">
  Add to Cart
</button>
```

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data-kb-track-click` | Yes | — | Event name to fire |
| `data-kb-click-channel` | No | `'engagement'` | Channel for the event |

Elements with `data-kb-track-click` skip the generic auto-click tracking to avoid double-counting. Disable with `autoTrackClicks: false`.

### Visibility Duration

Track how long elements are visible in the viewport:

```html
<!-- Basic -->
<section data-kb-track-visibility="Pricing Section Viewed">...</section>

<!-- With optional channel and threshold -->
<div
  data-kb-track-visibility="Hero Banner Viewed"
  data-kb-visibility-channel="marketing"
  data-kb-visibility-threshold="0.5"
>...</div>
```

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data-kb-track-visibility` | Yes | — | Event name to fire |
| `data-kb-visibility-channel` | No | `'engagement'` | Channel for the event |
| `data-kb-visibility-threshold` | No | `0.5` | IntersectionObserver threshold (0–1) |

Fires an event with `duration_seconds` and `duration_ms` tags when the element leaves the viewport, is removed from the DOM, or the user navigates away. Dynamically added elements are picked up via MutationObserver. Disable with `autoTrackVisibility: false`.

## Event Tracking

### Basic Event

```typescript
await kitbase.track({
  channel: 'engagement',
  event: 'Button Clicked',
});
```

### Event with Metadata

```typescript
await kitbase.track({
  channel: 'payments',
  event: 'Subscription Started',
  user_id: 'user_123',
  icon: '💰',
  notify: true,
  description: 'New premium subscription',
  tags: {
    plan: 'premium',
    interval: 'monthly',
    amount: 1999,
  },
});
```

### Duration Tracking

```typescript
// Start timing
kitbase.timeEvent('Video Watched');

// ... user watches video ...

// Track with automatic duration — $duration tag included automatically
await kitbase.track({
  channel: 'engagement',
  event: 'Video Watched',
  tags: { video_id: '123' },
});
```

## Web Analytics

### Page Views

```typescript
// Manual
await kitbase.trackPageView();

// With custom path/title
await kitbase.trackPageView({
  path: '/products/123',
  title: 'Product Details',
});

// Enable automatic tracking on route changes
kitbase.enableAutoPageViews();
```

### Revenue

```typescript
await kitbase.trackRevenue({
  amount: 4999,
  currency: 'USD',
  tags: { product_id: 'prod_123', coupon: 'SAVE20' },
});
```

## User Identification

```typescript
// Identify a user
await kitbase.identify({
  userId: 'user_123',
  traits: { email: 'user@example.com', plan: 'premium' },
});

// Reset on logout
kitbase.reset();
```

## Super Properties

Properties included with every event:

```typescript
kitbase.register({ app_version: '2.1.0', platform: 'web' });

// Set only if not already set
kitbase.registerOnce({ first_visit: new Date().toISOString() });

// Remove / clear
kitbase.unregister('platform');
kitbase.clearSuperProperties();
```

## Privacy & Consent

```typescript
// Opt out (persisted to localStorage)
kitbase.optOut();

// Opt in
kitbase.optIn();

// Check status
kitbase.isOptedOut();  // boolean
kitbase.hasConsent();  // boolean
```

## Bot Detection

```typescript
const kitbase = new Kitbase({
  token: 'your-api-key',
  botDetection: { enabled: true },
});

kitbase.isBot();                // boolean
kitbase.getBotDetectionResult(); // detailed result
kitbase.redetectBot();          // force re-run
```

When bot detection is enabled and a bot is detected, all tracking calls are silently blocked.

## Offline Support

Events are queued locally when offline and synced when back online:

```typescript
const kitbase = new Kitbase({
  token: 'your-api-key',
  offline: { enabled: true },
});

// Check queue status
const stats = await kitbase.getQueueStats();

// Manual flush
await kitbase.flushQueue();

// Clear queue
await kitbase.clearQueue();
```

## Debug Mode

```typescript
kitbase.setDebugMode(true);
kitbase.setDebugMode(false);
kitbase.isDebugMode(); // boolean
```

## Cleanup

```typescript
kitbase.shutdown();
```

Disconnects observers, flushes pending scroll depth and visibility events, and cleans up event listeners.

## API Reference

### Event Tracking

| Method | Description |
|--------|-------------|
| `track(options)` | Track a custom event |
| `trackPageView(options?)` | Track a page view |
| `trackRevenue(options)` | Track a revenue event |
| `trackOutboundLink(options)` | Track an outbound link click |
| `trackClick(tags)` | Track a click event |

### User Identification

| Method | Description |
|--------|-------------|
| `identify(options)` | Identify a user with traits |
| `getUserId()` | Get the identified user ID |
| `reset()` | Reset user identity and session |

### Super Properties

| Method | Description |
|--------|-------------|
| `register(properties)` | Set properties included in all events |
| `registerOnce(properties)` | Set properties only if not already set |
| `unregister(key)` | Remove a super property |
| `getSuperProperties()` | Get all super properties |
| `clearSuperProperties()` | Clear all super properties |

### Time Events

| Method | Description |
|--------|-------------|
| `timeEvent(eventName)` | Start timing an event |
| `cancelTimeEvent(eventName)` | Cancel timing an event |
| `getTimedEvents()` | List all active timed events |
| `getEventDuration(eventName)` | Get elapsed time without stopping |

### Privacy & Consent

| Method | Description |
|--------|-------------|
| `optOut()` | Opt out of tracking |
| `optIn()` | Opt in to tracking |
| `isOptedOut()` | Check if opted out |
| `hasConsent()` | Check if user has consented |

### Bot Detection

| Method | Description |
|--------|-------------|
| `isBot()` | Check if current visitor is a bot |
| `getBotDetectionResult()` | Get detailed detection result |
| `redetectBot()` | Force re-run detection |

### Debug & Lifecycle

| Method | Description |
|--------|-------------|
| `setDebugMode(enabled)` | Toggle debug logging |
| `isDebugMode()` | Check if debug mode is on |
| `enableAutoPageViews()` | Enable automatic pageview tracking |
| `shutdown()` | Flush pending events and cleanup resources |

### Offline Queue (full build only)

| Method | Description |
|--------|-------------|
| `getQueueStats()` | Get queue size and status |
| `flushQueue()` | Manually flush the queue |
| `clearQueue()` | Clear all queued events |

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  KitbaseConfig,
  TrackOptions,
  TrackResponse,
  PageViewOptions,
  RevenueOptions,
  IdentifyOptions,
  AnalyticsConfig,
  Tags,
  TagValue,
  OfflineConfig,
  PrivacyConfig,
  BotDetectionConfig,
} from '@kitbase/analytics';
```

## Browser Support

- Chrome, Firefox, Safari, Edge (latest versions)
- Works in Node.js 18+

## License

MIT
