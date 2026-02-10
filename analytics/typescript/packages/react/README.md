# @kitbase/analytics-react

React integration for the Kitbase Analytics SDK. Provides hooks and context provider for easy integration with React applications.

## Installation

```bash
npm install @kitbase/analytics-react
# or
pnpm add @kitbase/analytics-react
# or
yarn add @kitbase/analytics-react
```

## Quick Start

```tsx
import { KitbaseProvider, useTrack } from '@kitbase/analytics-react';

function App() {
  return (
    <KitbaseProvider config={{ token: 'your-api-key' }}>
      <MyComponent />
    </KitbaseProvider>
  );
}

function MyComponent() {
  const track = useTrack();

  return (
    <button onClick={() => track({ channel: 'ui', event: 'Button Clicked' })}>
      Click me
    </button>
  );
}
```

## API Reference

### Provider

#### `KitbaseProvider`

Wrap your app with this provider to initialize Kitbase.

```tsx
<KitbaseProvider
  config={{
    token: 'your-api-key',
    debug: true,
    analytics: { autoTrackPageViews: true },
  }}
>
  <App />
</KitbaseProvider>
```

### Hooks

| Hook | Description |
|------|-------------|
| `useKitbase()` | Access the Kitbase instance directly |
| `useTrack()` | Track custom events |
| `useIdentify()` | Identify users |
| `usePageView()` | Track page views manually |
| `useAutoPageView(options?, deps?)` | Auto-track page views on mount/deps change |
| `useRevenue()` | Track revenue events |
| `useTimeEvent(eventName)` | Track event duration |
| `useSuperProperties(props, deps?)` | Register super properties |
| `useUserId()` | Get the identified user ID |
| `useReset()` | Reset user identity |
| `useOptedOut()` | Check if tracking is opted out |
| `useConsent()` | Manage tracking consent |

### Examples

#### Track Events

```tsx
function Button() {
  const track = useTrack();

  return (
    <button onClick={() => track({
      channel: 'ui',
      event: 'Button Clicked',
      tags: { button_id: 'cta' }
    })}>
      Click me
    </button>
  );
}
```

#### Identify Users

```tsx
function LoginForm() {
  const identify = useIdentify();

  const handleLogin = async (user: User) => {
    await identify({
      userId: user.id,
      traits: { email: user.email, plan: user.plan }
    });
  };

  return <form>...</form>;
}
```

#### Auto Track Page Views

```tsx
function ProductPage({ productId }: { productId: string }) {
  useAutoPageView(
    { tags: { product_id: productId } },
    [productId]
  );

  return <div>Product {productId}</div>;
}
```

#### Track Duration

```tsx
function VideoPlayer() {
  const { start } = useTimeEvent('Video Watched');
  const track = useTrack();

  return (
    <video
      onPlay={start}
      onEnded={() => track({
        channel: 'engagement',
        event: 'Video Watched',
        // $duration automatically included
      })}
    />
  );
}
```

#### Consent Management

```tsx
function CookieBanner() {
  const { optIn, optOut } = useConsent();
  const isOptedOut = useOptedOut();

  if (!isOptedOut) return null;

  return (
    <div>
      <p>We use analytics to improve your experience</p>
      <button onClick={optIn}>Accept</button>
      <button onClick={optOut}>Reject</button>
    </div>
  );
}
```

## License

MIT
