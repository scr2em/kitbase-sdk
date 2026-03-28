# @kitbase/messaging

Kitbase In-App Messaging SDK for TypeScript and JavaScript. Fetches targeted messages and renders them directly in the page.

**[Full Documentation](https://docs.kitbase.dev/sdks/messaging)**

## Installation

```bash
npm install @kitbase/messaging
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

### Script Tag (CDN)

```html
<script>
  window.KITBASE_MESSAGING = {
    sdkKey: 'your-sdk-key',
    userId: 'user_123',
  };
</script>
<script src="https://unpkg.com/@kitbase/messaging/dist/cdn.js"></script>
```

## License

MIT
