# @kitbase/react

Official Kitbase React SDK — hooks and providers for React applications.

## Installation

```bash
npm install @kitbase/react
# or
pnpm add @kitbase/react
# or
yarn add @kitbase/react
```

## Usage

Import only what you need — each feature is completely isolated:

```tsx
import { FlagsProvider, useBooleanFlag } from '@kitbase/react/flags';
import { ChangelogsProvider, useChangelog } from '@kitbase/react/changelogs';
import { EventsProvider, useTrack } from '@kitbase/react/events';
```

## Feature Flags

```tsx
import { FlagsProvider, useBooleanFlag } from '@kitbase/react/flags';

function App() {
  return (
    <FlagsProvider token="your-api-token">
      <MyFeature />
    </FlagsProvider>
  );
}

function MyFeature() {
  const { data: isEnabled, isLoading } = useBooleanFlag('new-feature', false, {
    context: { targetingKey: userId }
  });
  
  if (isLoading) return <Spinner />;
  return isEnabled ? <NewUI /> : <OldUI />;
}
```

### Hooks

#### `useBooleanFlag`

```tsx
const { data, isLoading, error, refetch } = useBooleanFlag('flag-key', false, {
  context: { targetingKey: userId, plan: 'premium' }
});
```

#### `useStringFlag`

```tsx
const { data: variant } = useStringFlag('checkout-variant', 'control', {
  context: { targetingKey: userId }
});
```

#### `useNumberFlag`

```tsx
const { data: maxItems } = useNumberFlag('max-cart-items', 10, {
  context: { targetingKey: userId }
});
```

#### `useJsonFlag`

```tsx
interface FeatureConfig {
  enabled: boolean;
  theme: string;
}

const { data: config } = useJsonFlag<FeatureConfig>(
  'feature-config',
  { enabled: false, theme: 'light' },
  { context: { targetingKey: userId } }
);
```

#### `useFlagDetails`

Get full resolution details:

```tsx
const { data: details } = useFlagDetails('feature-x', false, {
  context: { targetingKey: userId }
});

console.log(details?.reason, details?.variant);
```

#### `useFlagSnapshot`

Get all flags at once:

```tsx
const { data: snapshot, isLoading } = useFlagSnapshot({
  context: { targetingKey: userId }
});

snapshot?.flags.map(flag => console.log(flag.flagKey, flag.value));
```

## Changelogs

```tsx
import { ChangelogsProvider, useChangelog } from '@kitbase/react/changelogs';

function App() {
  return (
    <ChangelogsProvider token="your-api-token">
      <ChangelogPage />
    </ChangelogsProvider>
  );
}

function ChangelogPage() {
  const { data: changelog, isLoading } = useChangelog('2.0.0');

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1>Version {changelog?.version}</h1>
      <ReactMarkdown>{changelog?.markdown}</ReactMarkdown>
    </div>
  );
}
```

### Hooks

#### `useChangelog`

```tsx
const { data, isLoading, error, refetch } = useChangelog('2.0.0');
```

#### `useLazyChangelog`

Fetch on demand:

```tsx
const { fetch, data, isLoading } = useLazyChangelog();

<button onClick={() => fetch('2.0.0')}>Load Changelog</button>
```

## Event Tracking

```tsx
import { EventsProvider, useTrack } from '@kitbase/react/events';

function App() {
  return (
    <EventsProvider token="your-api-token">
      <CheckoutButton />
    </EventsProvider>
  );
}

function CheckoutButton() {
  const { track, isLoading } = useTrack();

  const handleCheckout = async () => {
    await track({
      channel: 'payments',
      event: 'Checkout Started',
      user_id: userId,
      icon: '🛒',
      tags: { cart_value: 99.99 },
    });
  };

  return <button onClick={handleCheckout} disabled={isLoading}>Checkout</button>;
}
```

### Hooks

#### `useTrack`

```tsx
const { track, isLoading, error, data, reset } = useTrack();

await track({
  channel: 'payments',
  event: 'Payment Completed',
  user_id: userId,
  icon: '💰',
  notify: true,
  tags: { amount: 99.99 },
});
```

#### `useTrackChannel`

Pre-configured for a specific channel:

```tsx
const { trackChannel, isLoading } = useTrackChannel('payments');

await trackChannel({
  event: 'Payment Completed',
  user_id: userId,
  tags: { amount: 99.99 },
});
```

## Combining Multiple Features

```tsx
import { FlagsProvider } from '@kitbase/react/flags';
import { EventsProvider } from '@kitbase/react/events';

function App() {
  return (
    <FlagsProvider token="your-api-token">
      <EventsProvider token="your-api-token">
        <YourApp />
      </EventsProvider>
    </FlagsProvider>
  );
}
```

## API Reference

### Types

```typescript
interface UseFlagOptions {
  context?: EvaluationContext;
  refetchOnContextChange?: boolean; // default: true
}

interface UseFlagResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface EvaluationContext {
  targetingKey?: string;
  [key: string]: unknown;
}

interface TrackOptions {
  channel: string;
  event: string;
  user_id?: string;
  icon?: string;
  notify?: boolean;
  description?: string;
  tags?: Record<string, string | number | boolean>;
}
```

## License

MIT
