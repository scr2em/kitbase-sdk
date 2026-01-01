# @kitbase/sdk

Official Kitbase SDK for TypeScript and JavaScript. Tree-shakable and fully typed.

## Installation

```bash
npm install @kitbase/sdk
# or
pnpm add @kitbase/sdk
# or
yarn add @kitbase/sdk
```

## Features

Import only what you need:

```typescript
import { Kitbase } from '@kitbase/sdk/events';
// import { Changelogs } from '@kitbase/sdk/changelogs';  // coming soon
// import { Flags } from '@kitbase/sdk/flags';            // coming soon
```

## Events

Track events and logs in your application.

```typescript
import { Kitbase } from '@kitbase/sdk/events';

const kitbase = new Kitbase({
  token: '<YOUR_API_KEY>',
});

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

### API

#### `kitbase.track(options)`

```typescript
interface TrackOptions {
  channel: string;              // Required: channel/category
  event: string;                // Required: event name
  user_id?: string;             // Optional: user identifier
  icon?: string;                // Optional: emoji or icon name
  notify?: boolean;             // Optional: send notification
  description?: string;         // Optional: event description
  tags?: Record<string, string | number | boolean>;  // Optional: metadata
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

```typescript
import {
  Kitbase,
  KitbaseError,
  AuthenticationError,
  ApiError,
  ValidationError,
  TimeoutError,
} from '@kitbase/sdk/events';

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
  }
}
```

## Tree Shaking

This package supports tree-shaking. Only the features you import will be included in your bundle:

```typescript
// Only events code is bundled
import { Kitbase } from '@kitbase/sdk/events';
```

## Requirements

- Node.js 18 or later
- A Kitbase API key

## License

MIT

