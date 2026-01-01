# Kitbase SDK

Official SDKs for [Kitbase](https://kitbase.io).

## Packages

### TypeScript / JavaScript

| Package                                              | Description       | Status |
| ---------------------------------------------------- | ----------------- | ------ |
| [@kitbase/events](./packages/typescript/events)      | Event tracking    | ✅     |
| [@kitbase/changelogs](./packages/typescript/changelogs) | Changelogs     | 🚧     |
| [@kitbase/flags](./packages/typescript/flags)        | Feature flags     | 🚧     |

### Python (coming soon)

| Package          | Description       | Status |
| ---------------- | ----------------- | ------ |
| kitbase-events   | Event tracking    | 🚧     |
| kitbase-changelogs | Changelogs      | 🚧     |
| kitbase-flags    | Feature flags     | 🚧     |

### PHP (coming soon)

| Package              | Description       | Status |
| -------------------- | ----------------- | ------ |
| kitbase/events       | Event tracking    | 🚧     |
| kitbase/changelogs   | Changelogs        | 🚧     |
| kitbase/flags        | Feature flags     | 🚧     |

## Quick Start

### TypeScript / JavaScript

```bash
npm install @kitbase/events
```

```typescript
import { Kitbase } from '@kitbase/events';

const kitbase = new Kitbase({
  token: '<YOUR_API_KEY>',
});

await kitbase.track({
  channel: 'payments',
  event: 'New Subscription',
  user_id: 'user-123',
  icon: '💰',
  notify: true,
  tags: {
    plan: 'premium',
    cycle: 'monthly',
  },
});
```

## Repository Structure

```
kitbase-sdk/
├── packages/
│   ├── typescript/
│   │   ├── events/       # @kitbase/events
│   │   ├── changelogs/   # @kitbase/changelogs (coming soon)
│   │   └── flags/        # @kitbase/flags (coming soon)
│   ├── python/           # Python SDKs (coming soon)
│   └── php/              # PHP SDKs (coming soon)
└── ...
```

## Development

This is a monorepo managed with [pnpm](https://pnpm.io/).

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## License

MIT
