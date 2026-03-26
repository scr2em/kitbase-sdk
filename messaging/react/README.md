# @kitbase/messaging-react

React bindings for the Kitbase In-App Messaging SDK. Provides a provider and hooks for automatic or custom message rendering.

## Installation

```bash
npm install @kitbase/messaging-react
# or
pnpm add @kitbase/messaging-react
# or
yarn add @kitbase/messaging-react
```

Peer dependency: `react >= 17`

## Quick Start

### Auto-render (default)

Wrap your app with the provider — messages appear automatically with no extra code:

```tsx
import { MessagingProvider } from "@kitbase/messaging-react";

function App() {
	return (
		<MessagingProvider config={{ sdkKey: "your-sdk-key", userId: user.id }}>
			<YourApp />
		</MessagingProvider>
	);
}
```

### Custom rendering

Set `autoShow: false` and use the `useMessages` hook to render your own UI:

```tsx
import { MessagingProvider, useMessages } from "@kitbase/messaging-react";

function App() {
	return (
		<MessagingProvider config={{ sdkKey: "your-sdk-key", autoShow: false }}>
			<MessageList />
		</MessagingProvider>
	);
}

function MessageList() {
	const { messages, markViewed, isLoading } = useMessages({
		pollInterval: 60_000,
	});

	if (isLoading) return <Spinner />;

	return messages.map((msg) => (
		<div key={msg.id}>
			<h3>{msg.title}</h3>
			<p>{msg.body}</p>
			{msg.actionButton && <a href={msg.actionButton.url}>{msg.actionButton.text}</a>}
			<button onClick={() => markViewed(msg.id)}>Dismiss</button>
		</div>
	));
}
```

## API

### `<MessagingProvider>`

| Prop       | Type              | Description                                                                                    |
| ---------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| `config`   | `MessagingConfig` | SDK configuration (see [@kitbase/messaging](https://www.npmjs.com/package/@kitbase/messaging)) |
| `children` | `ReactNode`       | Your app                                                                                       |

The provider creates a `Messaging` instance and cleans it up on unmount. It recreates the instance when `sdkKey` changes.

### `useMessages(options?)`

Fetches messages with optional polling. For use with `autoShow: false`.

**Options:**

| Option         | Type                     | Default | Description                             |
| -------------- | ------------------------ | ------- | --------------------------------------- |
| `enabled`      | `boolean`                | `true`  | Whether to fetch on mount               |
| `pollInterval` | `number`                 | —       | Polling interval in ms. Omit to disable |
| `userId`       | `string`                 | —       | User ID for filtering                   |
| `metadata`     | `Record<string, string>` | —       | Targeting metadata                      |

**Returns:** `UseMessagesResult`

| Field        | Type                                   | Description                         |
| ------------ | -------------------------------------- | ----------------------------------- |
| `messages`   | `InAppMessage[]`                       | Active messages                     |
| `isLoading`  | `boolean`                              | Initial fetch in progress           |
| `error`      | `Error \| null`                        | Most recent fetch error             |
| `markViewed` | `(messageId: string) => Promise<void>` | Mark as viewed and remove from list |
| `refresh`    | `() => Promise<void>`                  | Manually re-fetch                   |

### `useLazyMessages()`

Fetch messages on demand (not on mount).

```tsx
function InboxButton() {
	const { fetch, messages, isLoading } = useLazyMessages();

	return (
		<>
			<button onClick={() => fetch()}>Check Messages</button>
			{messages.map((msg) => (
				<div key={msg.id}>{msg.title}</div>
			))}
		</>
	);
}
```

### `useMessagingContext()`

Access the underlying `Messaging` instance directly for advanced usage (e.g., calling `identify()`, `reset()`).

```tsx
const messaging = useMessagingContext();
messaging.identify("user_123");
```

## TypeScript

All core types are re-exported for convenience:

```typescript
import type {
	MessagingConfig,
	InAppMessage,
	MessageType,
	MessageButton,
	GetMessagesOptions,
} from "@kitbase/messaging-react";
```

## License

MIT