# @kitbase/messaging-react

React bindings for the Kitbase In-App Messaging SDK. Provides a provider and hooks for automatic or custom message rendering.

**[Full Documentation](https://docs.kitbase.dev/sdks/messaging-react)**

## Installation

```bash
npm install @kitbase/messaging-react
```

## Quick Start

```tsx
import { MessagingProvider } from '@kitbase/messaging-react';

function App() {
  return (
    <MessagingProvider config={{ sdkKey: 'your-sdk-key', userId: user.id }}>
      <YourApp />
    </MessagingProvider>
  );
}
```

## License

MIT
