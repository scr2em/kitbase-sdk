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
// import { Flags } from '@kitbase/sdk/flags';  // coming soon
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
