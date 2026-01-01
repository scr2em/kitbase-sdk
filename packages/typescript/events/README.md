# @kitbase/events

Kitbase Events SDK for TypeScript and JavaScript. Tree-shakable and fully typed.

## Installation

```bash
npm install @kitbase/events
# or
pnpm add @kitbase/events
# or
yarn add @kitbase/events
```

## Quick Start

```typescript
import { Kitbase } from '@kitbase/events';

const kitbase = new Kitbase({
  token: '<YOUR_API_KEY>',
});

// Track an event
await kitbase.track({
  channel: 'payments',
  event: 'New Subscription',
  user_id: 'user-123',
  icon: '💰',
  notify: true,
  description: 'User subscribed to premium plan',
  tags: {
    plan: 'premium',
    cycle: 'monthly',
    trial: false,
  },
});
```

## Configuration

```typescript
const kitbase = new Kitbase({
  // Required: Your Kitbase API key
  token: '<YOUR_API_KEY>',
});
```

## API

### `kitbase.track(options)`

Track an event.

```typescript
interface TrackOptions {
  // Required: The channel/category for the event
  channel: string;

  // Required: The name of the event
  event: string;

  // Optional: User identifier
  user_id?: string;

  // Optional: Icon (emoji or icon name)
  icon?: string;

  // Optional: Send a notification (default: false)
  notify?: boolean;

  // Optional: Event description
  description?: string;

  // Optional: Additional metadata tags
  tags?: Record<string, string | number | boolean>;
}
```

**Returns:** `Promise<TrackResponse>`

```typescript
interface TrackResponse {
  id: string;
  event: string;
  timestamp: string;
}
```

## Error Handling

The SDK exports typed error classes for precise error handling:

```typescript
import {
  Kitbase,
  KitbaseError,
  AuthenticationError,
  ApiError,
  ValidationError,
  TimeoutError,
} from '@kitbase/events';

try {
  await kitbase.track({
    channel: 'payments',
    event: 'New Subscription',
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Invalid API key
  } else if (error instanceof ValidationError) {
    // Missing required fields
    console.error(error.field);
  } else if (error instanceof TimeoutError) {
    // Request timed out
  } else if (error instanceof ApiError) {
    // API returned an error
    console.error(error.statusCode);
    console.error(error.response);
  } else if (error instanceof KitbaseError) {
    // Generic SDK error
  }
}
```

## Tree Shaking

This package is fully tree-shakable. Only the code you use will be included in your bundle:

```typescript
import { Kitbase } from '@kitbase/events';
import type { TrackOptions } from '@kitbase/events';
```

## Requirements

- Node.js 18 or later
- A Kitbase API key

## License

MIT
