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
import { Changelogs } from '@kitbase/sdk/changelogs';
import { FlagsClient } from '@kitbase/sdk/flags';
```

---

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

### `kitbase.track(options)`

| Option        | Type                                      | Required | Description              |
| ------------- | ----------------------------------------- | -------- | ------------------------ |
| `channel`     | `string`                                  | ✅       | Channel/category         |
| `event`       | `string`                                  | ✅       | Event name               |
| `user_id`     | `string`                                  | –        | User identifier          |
| `icon`        | `string`                                  | –        | Emoji or icon name       |
| `notify`      | `boolean`                                 | –        | Send notification        |
| `description` | `string`                                  | –        | Event description        |
| `tags`        | `Record<string, string\|number\|boolean>` | –        | Additional metadata      |

---

## Changelogs

Fetch version changelogs for your application.

```typescript
import { Changelogs } from '@kitbase/sdk/changelogs';

const changelogs = new Changelogs({
  token: '<YOUR_API_KEY>',
});

const changelog = await changelogs.get('1.0.0');
console.log(changelog.version);
console.log(changelog.markdown);
```

### `changelogs.get(version)`

Get a published changelog by version.

```typescript
const changelog = await changelogs.get('1.0.0');
```

**Returns:** `Promise<ChangelogResponse>`

```typescript
interface ChangelogResponse {
  id: string;
  version: string;
  markdown: string;      // Changelog content in Markdown format
  isPublished: boolean;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Error Handling

Each module exports typed error classes:

### Events Errors

```typescript
import {
  KitbaseError,
  AuthenticationError,
  ApiError,
  ValidationError,
  TimeoutError,
} from '@kitbase/sdk/events';
```

### Changelogs Errors

```typescript
import {
  ChangelogsError,
  AuthenticationError,
  ApiError,
  NotFoundError,
  ValidationError,
  TimeoutError,
} from '@kitbase/sdk/changelogs';
```

### Example

```typescript
try {
  const changelog = await changelogs.get('1.0.0');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log(`Version ${error.version} not found`);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  }
}
```

---

## Feature Flags

Evaluate feature flags in your application. The SDK supports two evaluation modes:

- **Remote Evaluation** (default): Each flag evaluation makes an API call
- **Local Evaluation**: Fetches config once and evaluates flags locally

### Remote Evaluation (Default)

Each flag evaluation makes an API call. Simple to use, always up-to-date.

```typescript
import { FlagsClient } from '@kitbase/sdk/flags';

const flags = new FlagsClient({
  token: '<YOUR_API_KEY>',
});

// Simple boolean check
const isEnabled = await flags.getBooleanValue('dark-mode', false, {
  targetingKey: 'user-123',
  plan: 'premium',
});

// Get full resolution details
const result = await flags.evaluateFlag('feature-x', {
  context: { targetingKey: 'user-123', country: 'US' },
});
console.log(result.value, result.reason);
```

### Local Evaluation

Fetches flag configuration once and evaluates flags locally. Best for high-throughput scenarios with sub-millisecond evaluation.

```typescript
import { FlagsClient } from '@kitbase/sdk/flags';

const flags = new FlagsClient({
  token: '<YOUR_API_KEY>',
  enableLocalEvaluation: true,
  environmentRefreshIntervalSeconds: 60, // Refresh config every 60s
});

// Initialize (fetches configuration)
await flags.initialize();

// Evaluate flags locally (no network call)
const isEnabled = await flags.getBooleanValue('dark-mode', false, {
  targetingKey: 'user-123',
  plan: 'premium',
});

// Listen for configuration changes
flags.on((event) => {
  if (event.type === 'configurationChanged') {
    console.log('Flags updated:', event.config.etag);
  }
});

// Clean up when done
flags.close();
```

### FlagsClient Options

| Option                             | Type                                  | Default | Description                                      |
| ---------------------------------- | ------------------------------------- | ------- | ------------------------------------------------ |
| `token`                            | `string`                              | –       | Your Kitbase API key (required)                  |
| `enableLocalEvaluation`            | `boolean`                             | `false` | Enable local evaluation mode                     |
| `environmentRefreshIntervalSeconds`| `number`                              | `60`    | Config refresh interval in seconds (local only)  |
| `enableRealtimeUpdates`            | `boolean`                             | `false` | Use SSE streaming instead of polling (local only)|
| `initialConfiguration`             | `FlagConfiguration`                   | –       | Initial config for SSR/offline (local only)      |
| `onConfigurationChange`            | `(config: FlagConfiguration) => void` | –       | Callback when configuration updates (local only) |
| `onError`                          | `(error: Error) => void`              | –       | Callback for errors (local only)                 |

### Flag Value Methods

```typescript
// Boolean flags
const boolValue = await flags.getBooleanValue('flag-key', defaultValue, context);
const boolDetails = await flags.getBooleanDetails('flag-key', defaultValue, context);

// String flags
const strValue = await flags.getStringValue('flag-key', defaultValue, context);
const strDetails = await flags.getStringDetails('flag-key', defaultValue, context);

// Number flags
const numValue = await flags.getNumberValue('flag-key', defaultValue, context);
const numDetails = await flags.getNumberDetails('flag-key', defaultValue, context);

// JSON flags
const jsonValue = await flags.getJsonValue('flag-key', defaultValue, context);
const jsonDetails = await flags.getJsonDetails('flag-key', defaultValue, context);

// Get all flags at once
const snapshot = await flags.getSnapshot(context);
```

### Evaluation Context

The evaluation context is used for targeting and percentage rollouts:

```typescript
const context = {
  targetingKey: 'user-123',  // Required for percentage rollouts
  plan: 'premium',           // Custom attribute for targeting
  country: 'US',             // Custom attribute for targeting
  age: 25,                   // Supports any JSON-serializable value
};
```

### Flags Errors

```typescript
import {
  FlagsError,
  AuthenticationError,
  ApiError,
  ValidationError,
  TimeoutError,
  FlagNotFoundError,
  TypeMismatchError,
} from '@kitbase/sdk/flags';
```

---

## Tree Shaking

This package supports tree-shaking. Only the features you import will be included in your bundle:

```typescript
// Only events code is bundled
import { Kitbase } from '@kitbase/sdk/events';

// Only changelogs code is bundled
import { Changelogs } from '@kitbase/sdk/changelogs';
```

## Requirements

- Node.js 18 or later
- A Kitbase API key

## License

MIT
