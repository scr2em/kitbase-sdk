# @kitbase/analytics-react

React integration for the Kitbase Analytics SDK. Provides hooks and context provider for easy integration with React applications.

**[Full Documentation](https://docs.kitbase.dev/sdks/react)**

## Installation

```bash
npm install @kitbase/analytics-react
```

## Quick Start

```tsx
import { KitbaseAnalyticsProvider, useTrack } from '@kitbase/analytics-react';

function App() {
  return (
    <KitbaseAnalyticsProvider config={{ sdkKey: 'your-api-key' }}>
      <MyComponent />
    </KitbaseAnalyticsProvider>
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

## License

MIT
