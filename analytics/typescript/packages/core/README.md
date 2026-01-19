# @kitbase/analytics

Official Kitbase SDK for event tracking and web analytics in TypeScript and JavaScript applications.

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
});

// Track a custom event
await kitbase.track({
  channel: 'payments',
  event: 'Purchase Completed',
  tags: {
    product_id: 'prod_123',
    amount: 4999,
  },
});
```

## Features

- **Event Tracking** - Track custom events with metadata
- **Web Analytics** - Automatic session tracking, pageviews, and bounce rate
- **User Identification** - Link anonymous users to authenticated users
- **Offline Support** - Queue events locally when offline, sync when back online
- **Super Properties** - Set properties that are included with every event
- **Duration Tracking** - Measure how long actions take

## Configuration

```typescript
const kitbase = new Kitbase({
  // Required: Your API key
  token: 'your-api-key',

  // Optional: Custom API endpoint
  baseUrl: 'https://api.kitbase.dev',

  // Optional: Enable debug logging
  debug: true,

  // Optional: Offline queue configuration
  offline: {
    enabled: true,
    maxSize: 1000,           // Max events to queue
    flushInterval: 30000,    // Flush every 30 seconds
  },

  // Optional: Analytics configuration
  analytics: {
    autoTrackSessions: true,    // Track sessions automatically (default: true)
    autoTrackPageViews: false,  // Track pageviews on route changes
    sessionTimeout: 1800000,    // 30 minutes in ms
  },
});
```

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

Measure how long an action takes:

```typescript
// Start timing
kitbase.timeEvent('Video Watched');

// ... user watches video ...

// Track with automatic duration
await kitbase.track({
  channel: 'engagement',
  event: 'Video Watched',
  tags: { video_id: '123' },
});
// Event includes $duration property in seconds
```

## Web Analytics

### Automatic Session Tracking

Sessions are tracked automatically by default. A new session starts when:
- User visits for the first time
- User returns after 30 minutes of inactivity

### Track Page Views

```typescript
// Manual pageview tracking
await kitbase.trackPageView();

// With custom path/title
await kitbase.trackPageView({
  path: '/products/123',
  title: 'Product Details',
});
```

### Auto-track Page Views (SPAs)

```typescript
// Enable automatic tracking on route changes
kitbase.enableAutoPageViews();
```

### Track Revenue

```typescript
await kitbase.trackRevenue({
  amount: 4999, // Amount in cents ($49.99)
  currency: 'USD',
  tags: {
    product_id: 'prod_123',
    coupon: 'SAVE20',
  },
});
```

## User Identification

### Identify a User

Link anonymous activity to a known user:

```typescript
kitbase.identify({
  userId: 'user_123',
  traits: {
    email: 'user@example.com',
    plan: 'premium',
    company: 'Acme Inc',
  },
});
```

### Reset on Logout

Clear user identity and start fresh:

```typescript
kitbase.reset();
```

## Super Properties

Properties included with every event:

```typescript
// Set super properties
kitbase.register({
  app_version: '2.1.0',
  platform: 'web',
});

// Set only if not already set
kitbase.registerOnce({
  first_visit: new Date().toISOString(),
});

// Remove a super property
kitbase.unregister('platform');

// Clear all
kitbase.clearSuperProperties();
```

## Anonymous ID

Every user gets a persistent anonymous ID:

```typescript
const anonymousId = kitbase.getAnonymousId();
```

## Session Management

```typescript
// Get current session ID
const sessionId = kitbase.getSessionId();

// Get full session data
const session = kitbase.getSession();
// { id, startedAt, lastActivityAt, screenViewCount, entryPath, entryReferrer }
```

## Offline Support

Events are queued locally when offline and synced when back online:

```typescript
const kitbase = new Kitbase({
  token: 'your-api-key',
  offline: {
    enabled: true,
    maxSize: 1000,        // Maximum events to store
    flushInterval: 30000, // Sync interval in ms
  },
});

// Check queue status
const stats = await kitbase.getQueueStats();
// { size: 5, isFlushing: false }

// Manual flush
await kitbase.flushQueue();

// Clear queue
await kitbase.clearQueue();
```

## Lite Build

For a smaller bundle size (~20KB vs ~56KB), use the lite build without offline queue support:

```typescript
import { Kitbase } from '@kitbase/analytics/lite';

const kitbase = new Kitbase({
  token: 'your-api-key',
});
```

### Script Tag (Auto-initialization)

```html
<script>
  window.KITBASE_CONFIG = {
    token: 'your-api-key',
    debug: true,
    analytics: { autoTrackPageViews: true }
  };
</script>
<script src="https://cdn.example.com/lite.global.js"></script>
<script>
  window.kitbase.track({ channel: 'web', event: 'Page Loaded' });
</script>
```

## Debug Mode

```typescript
// Enable at initialization
const kitbase = new Kitbase({
  token: 'your-api-key',
  debug: true,
});

// Or toggle at runtime
kitbase.setDebugMode(true);
kitbase.setDebugMode(false);

// Check status
const isDebug = kitbase.isDebugMode();
```

## Cleanup

Properly shutdown when done:

```typescript
await kitbase.shutdown();
```

## API Reference

### Kitbase Class

| Method | Description |
|--------|-------------|
| `track(options)` | Track a custom event |
| `trackPageView(options?)` | Track a page view |
| `trackRevenue(options)` | Track a revenue event |
| `identify(options)` | Identify the current user |
| `reset()` | Reset user identity and session |
| `register(props)` | Set super properties |
| `registerOnce(props)` | Set super properties if not already set |
| `unregister(key)` | Remove a super property |
| `clearSuperProperties()` | Clear all super properties |
| `timeEvent(name)` | Start timing an event |
| `cancelTimeEvent(name)` | Cancel timing an event |
| `getAnonymousId()` | Get the anonymous ID |
| `getSessionId()` | Get current session ID |
| `getSession()` | Get current session data |
| `getUserId()` | Get identified user ID |
| `enableAutoPageViews()` | Enable automatic pageview tracking |
| `setDebugMode(enabled)` | Enable/disable debug logging |
| `getQueueStats()` | Get offline queue statistics |
| `flushQueue()` | Manually flush the offline queue |
| `clearQueue()` | Clear the offline queue |
| `shutdown()` | Cleanup and shutdown the client |

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import {
  Kitbase,
  KitbaseConfig,
  TrackOptions,
  TrackResponse,
  PageViewOptions,
  RevenueOptions,
  IdentifyOptions,
  Session,
  Tags,
} from '@kitbase/analytics';
```

## Browser Support

- Chrome, Firefox, Safari, Edge (latest versions)
- Works in Node.js 18+

## License

MIT
