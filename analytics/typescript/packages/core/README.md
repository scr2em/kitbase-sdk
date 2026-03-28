# @kitbase/analytics

Core Kitbase Analytics SDK for TypeScript and JavaScript. Framework-agnostic — works in any browser environment.

**[Full Documentation](https://docs.kitbase.dev/sdks/javascript)**

## Installation

```bash
npm install @kitbase/analytics
```

## Quick Start

```typescript
import { Kitbase } from '@kitbase/analytics';

const kitbase = new Kitbase({
  sdkKey: 'your-api-key',
});

await kitbase.track({
  channel: 'payments',
  event: 'Purchase Completed',
  tags: { product_id: 'prod_123', amount: 4999 },
});
```

### Script Tag (CDN)

```html
<script>
  window.KITBASE_CONFIG = { sdkKey: 'your-api-key' };
</script>
<script defer src="https://kitbase.dev/script.js"></script>
```

## License

MIT
