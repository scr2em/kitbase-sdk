# @kitbase/messaging

Kitbase In-App Messaging SDK for TypeScript and JavaScript. Fetches targeted messages and renders them directly in the page — modals, banners, cards, and full-screen images with automatic stacking.

## Installation

```bash
npm install @kitbase/messaging
# or
pnpm add @kitbase/messaging
# or
yarn add @kitbase/messaging
```

## Quick Start

```typescript
import { init } from '@kitbase/messaging';

const messaging = init({
  sdkKey: 'your-sdk-key',
  userId: currentUser.id,
  metadata: { plan: 'pro' },
});

// Messages are fetched and rendered automatically!
```

That's it — messages matching your targeting criteria will appear as modals, banners, cards, or images with no extra code.

### Script Tag (CDN)

No bundler required. Works with any page — PHP, WordPress, static HTML, etc.

```html
<script>
  window.KITBASE_MESSAGING = {
    sdkKey: 'your-sdk-key',
    userId: 'user_123',
    metadata: { plan: 'free', country: 'US' },
  };
</script>
<script src="https://cdn.kitbase.dev/messaging.js"></script>
<!-- Messages appear automatically! -->
```

The script auto-initializes and exposes `window.kitbaseMessaging` for further control:

```html
<script>
  // After user logs in
  window.kitbaseMessaging.identify('user_456');
</script>
```

Or initialize manually:

```html
<script src="https://cdn.kitbase.dev/messaging.js"></script>
<script>
  var messaging = KitbaseMessaging.init({ sdkKey: 'your-sdk-key' });

  messaging.identify('user_123');
  messaging.close(); // clean up
</script>
```

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `sdkKey` | `string` | **(required)** | Your Kitbase SDK key |
| `baseUrl` | `string` | `'https://api.kitbase.dev'` | API base URL (for self-hosted instances) |
| `userId` | `string` | — | Current user ID. Filters out already-viewed show-once messages |
| `metadata` | `Record<string, string>` | — | Key-value pairs for targeting evaluation |
| `pollInterval` | `number` | `60000` | Polling interval in ms. Set to `0` to fetch once only |
| `autoShow` | `boolean` | `true` | Automatically render messages in the page |
| `onShow` | `(message) => void` | — | Called when a message is displayed |
| `onDismiss` | `(message) => void` | — | Called when a message is dismissed |
| `onAction` | `(message, button) => void \| false` | — | Called on button click. Return `false` to prevent navigation |

## API

### `init(config): Messaging`

Initialize the SDK. Creates a singleton instance.

```typescript
import { init } from '@kitbase/messaging';

const messaging = init({ sdkKey: 'your-sdk-key' });
```

### `getInstance(): Messaging | null`

Get the current singleton instance.

```typescript
import { getInstance } from '@kitbase/messaging';

const messaging = getInstance();
```

### `messaging.identify(userId)`

Set the current user. Triggers an immediate re-fetch to filter out already-viewed show-once messages.

```typescript
messaging.identify('user_123');
```

### `messaging.reset()`

Clear the user and dismissed state. Call on logout.

```typescript
messaging.reset();
```

### `messaging.markViewed(messageId)`

Record that the user has viewed a message. The message is removed from the UI immediately and the view is recorded on the server. Requires `identify()` to have been called first.

```typescript
messaging.markViewed('msg_abc');
```

### `messaging.getMessages(options?)`

Fetch messages without rendering (data-only). Useful with `autoShow: false`.

```typescript
const messaging = init({ sdkKey: '...', autoShow: false });
const messages = await messaging.getMessages();
```

### `messaging.subscribe(callback, options?)`

Subscribe to messages with polling. Returns an unsubscribe function.

```typescript
const unsub = messaging.subscribe(
  (messages) => renderMyUI(messages),
  { pollInterval: 30_000 },
);

// Later
unsub();
```

### `messaging.close()`

Stop polling, remove all rendered UI, and clean up.

## Message Types

The SDK renders four message types, each with automatic stacking:

| Type | Behavior |
|---|---|
| `modal` | Centered overlay with backdrop |
| `banner` | Fixed to top, stacks vertically |
| `card` | Fixed to bottom-right, stacks vertically |
| `image` | Full-screen image overlay |

All rendering uses shadow DOM for complete style isolation from your page.

## Behavior

- **Polling pauses** when the browser tab is hidden and resumes immediately when the tab becomes visible again.
- **Dismissed messages** are tracked in-memory for the current session and filtered from subsequent polls.
- **Show-once messages** are filtered server-side when a `userId` is provided.

## TypeScript Types

```typescript
import type {
  MessagingConfig,
  InAppMessage,
  MessageType,
  MessageButton,
  GetMessagesOptions,
  SubscribeOptions,
} from '@kitbase/messaging';
```

## Error Types

```typescript
import {
  MessagingError,      // Base error
  AuthenticationError,  // Invalid SDK key (401)
  ApiError,             // API error (non-2xx)
  ValidationError,      // Invalid config or missing params
  TimeoutError,         // Request timed out
} from '@kitbase/messaging';
```

## License

MIT
