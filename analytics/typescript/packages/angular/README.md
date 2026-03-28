# @kitbase/analytics-angular

Angular integration for the Kitbase Analytics SDK. Provides DI-based services and a standalone-first API.

**[Full Documentation](https://docs.kitbase.dev/sdks/angular)**

## Installation

```bash
npm install @kitbase/analytics-angular
```

## Quick Start

```typescript
// app.config.ts
import { provideKitbaseAnalytics } from '@kitbase/analytics-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideKitbaseAnalytics({ sdkKey: 'your-sdk-key' }),
  ],
};
```

```typescript
// component.ts
import { Component, inject } from '@angular/core';
import { KitbaseAnalyticsService } from '@kitbase/analytics-angular';

@Component({
  selector: 'app-button',
  template: '<button (click)="onClick()">Click me</button>',
})
export class ButtonComponent {
  private kitbase = inject(KitbaseAnalyticsService);

  onClick() {
    this.kitbase.track({
      channel: 'ui',
      event: 'Button Clicked',
    });
  }
}
```

## License

MIT
