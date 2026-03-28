# Kitbase Feature Flags SDK

Feature flag evaluation for TypeScript/JavaScript applications with targeting, percentage rollouts, and OpenFeature compatibility.

**[Full Documentation](https://docs.kitbase.dev/features/flags)**

## Packages

| Package | Install |
|---------|---------|
| [`@kitbase/flags`](./typescript) | `npm install @kitbase/flags` |
| [`@kitbase/flags-react`](./react) | `npm install @kitbase/flags-react` |
| [`@kitbase/flags-angular`](./angular) | `npm install @kitbase/flags-angular` |

## Quick Start

```typescript
import { FlagsClient } from '@kitbase/flags';

const flags = new FlagsClient({
  sdkKey: '<YOUR_SDK_KEY>',
  defaultValues: {
    'dark-mode': false,
  },
});

const isEnabled = await flags.getBooleanValue('dark-mode', {
  targetingKey: 'user-123',
  plan: 'premium',
});
```

## License

MIT
