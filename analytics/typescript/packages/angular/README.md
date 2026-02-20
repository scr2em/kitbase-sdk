# @kitbase/analytics-angular

Angular integration for the Kitbase Analytics SDK.

## Installation

```bash
npm install @kitbase/analytics-angular
# or
pnpm add @kitbase/analytics-angular
# or
yarn add @kitbase/analytics-angular
```

## Usage

### Option 1: Direct — just call `init()`

No Angular DI needed. Call `init()` anywhere (e.g. `main.ts`, a component, a service):

```typescript
import { init } from '@kitbase/analytics-angular';

const kitbase = init({ token: 'your-api-key' });

// Track events
kitbase.track({ channel: 'ui', event: 'Button Clicked' });

// Identify users
kitbase.identify({ userId: 'user-123', traits: { email: 'user@example.com' } });
```

You can retrieve the instance later with `getInstance()`:

```typescript
import { getInstance } from '@kitbase/analytics-angular';

const kitbase = getInstance();
kitbase?.track({ channel: 'ui', event: 'Page Loaded' });
```

### Option 2: Angular DI — `provideKitbaseAnalytics()` + `inject()`

Register the provider in your app config, then inject it in any component or service:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideKitbaseAnalytics } from '@kitbase/analytics-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideKitbaseAnalytics({
      token: 'your-api-key',
      debug: true,
    }),
  ],
};
```

```typescript
// component.ts
import { Component, inject } from '@angular/core';
import { KitbaseAnalyticsService } from '@kitbase/analytics-angular';

@Component({
  selector: 'app-button',
  template: '<button (click)="onClick()">Click me</button>',
})
export class ButtonComponent {
  private kitbase = inject(KitbaseAnalyticsService);

  onClick() {
    this.kitbase.track({
      channel: 'ui',
      event: 'Button Clicked',
      tags: { button_id: 'cta' },
    });
  }
}
```

## Configuration

```typescript
init({
  // Required
  token: 'your-api-key',

  // Optional
  debug: true,
  baseUrl: 'https://api.kitbase.dev',

  analytics: {
    autoTrackPageViews: true,     // track route changes automatically
    autoTrackOutboundLinks: true, // track external link clicks
    autoTrackClicks: true,        // track button/link/input clicks + data-kb-track-click
    autoTrackScrollDepth: true,   // track max scroll depth per page
    autoTrackVisibility: true,    // track visibility duration via data attributes
    autoTrackWebVitals: false,    // track Core Web Vitals (LCP, CLS, INP, FCP, TTFB)
    autoDetectFrustration: true,  // detect rage clicks and dead clicks
  },

  privacy: {
    optOutByDefault: false,       // require explicit opt-in
    clearQueueOnOptOut: true,     // delete queued events on opt-out
  },

  offline: {
    enabled: true,                // queue events when offline
    maxQueueSize: 1000,
    flushInterval: 30000,
    flushBatchSize: 50,
    maxRetries: 3,
  },
});
```

Page views, clicks, outbound links, scroll depth, and visibility duration are tracked automatically by default. The core SDK intercepts `history.pushState`/`popstate`, so no Angular Router integration is needed.

## Data Attribute Events

Track events from HTML using data attributes — no JavaScript needed. Works in Angular, React, or vanilla HTML.

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

When the element leaves the viewport, navigates away, or is removed from the DOM, the SDK fires an event with `duration_seconds` and `duration_ms` tags.

Dynamically added elements (e.g. from Angular `@if` or `*ngIf`) are picked up automatically via MutationObserver. Disable with `autoTrackVisibility: false`.

## Web Vitals

Track [Core Web Vitals](https://web.dev/vitals/) by enabling `autoTrackWebVitals`:

```typescript
init({
  token: 'your-api-key',
  analytics: {
    autoTrackWebVitals: true,
  },
});
```

The SDK collects all 5 metrics (LCP, CLS, INP, FCP, TTFB) and sends them as a single `web_vitals` event. Metrics are sent once per page load with a 30-second timeout. Only collected metrics are included. See the [core SDK README](../core/README.md#web-vitals) for full details.

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
| `reset()` | Reset user identity |

### Super Properties

| Method | Description |
|--------|-------------|
| `register(properties)` | Set super properties (included in all events) |
| `registerOnce(properties)` | Set super properties only if not already set |
| `unregister(key)` | Remove a super property |
| `getSuperProperties()` | Get all super properties |
| `clearSuperProperties()` | Clear all super properties |

### Time Events

| Method | Description |
|--------|-------------|
| `timeEvent(eventName)` | Start timing an event |
| `cancelTimeEvent(eventName)` | Cancel timing an event |
| `getTimedEvents()` | List all active timed events |
| `getEventDuration(eventName)` | Get elapsed time in ms |

### Privacy & Consent

| Method | Description |
|--------|-------------|
| `optOut()` | Opt out of tracking |
| `optIn()` | Opt in to tracking |
| `isOptedOut()` | Check if opted out |
| `hasConsent()` | Check if user has consented |

### Debug

| Method | Description |
|--------|-------------|
| `setDebugMode(enabled)` | Toggle debug logging |
| `isDebugMode()` | Check if debug mode is on |
| `shutdown()` | Shutdown the SDK and cleanup |

## Examples

### Track Events

```typescript
kitbase.track({
  channel: 'ecommerce',
  event: 'Add to Cart',
  tags: { product_id: 'sku-123', price: 29.99 },
});
```

### Identify Users

```typescript
await kitbase.identify({
  userId: user.id,
  traits: { email: user.email, plan: user.plan },
});

// On logout
kitbase.reset();
```

### Track Duration

```typescript
// Start timer
kitbase.timeEvent('Video Watched');

// ... user watches video ...

// Track event — $duration tag is automatically included
kitbase.track({
  channel: 'engagement',
  event: 'Video Watched',
  tags: { video_id: 'abc' },
});
```

### Track Revenue

```typescript
kitbase.trackRevenue({
  amount: 19.99,
  currency: 'USD',
  tags: { plan: 'pro', cycle: 'monthly' },
});
```

### Consent Management

```typescript
@Component({
  template: `
    @if (showBanner) {
      <div>
        <p>We use analytics to improve your experience</p>
        <button (click)="accept()">Accept</button>
        <button (click)="reject()">Reject</button>
      </div>
    }
  `,
})
export class CookieBannerComponent {
  private kitbase = inject(KitbaseAnalyticsService);
  showBanner = !this.kitbase.hasConsent();

  accept() {
    this.kitbase.optIn();
    this.showBanner = false;
  }

  reject() {
    this.kitbase.optOut();
    this.showBanner = false;
  }
}
```

## Running the Example App

```bash
cd examples
pnpm install
pnpm start
```

Opens at `http://localhost:4200` with an interactive dashboard to test all SDK features.

## License

MIT
