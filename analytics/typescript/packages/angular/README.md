# @kitbase/analytics-angular

Angular integration for the Kitbase Analytics SDK. Provides an injectable service for easy integration with Angular applications.

## Installation

```bash
npm install @kitbase/analytics-angular
# or
pnpm add @kitbase/analytics-angular
# or
yarn add @kitbase/analytics-angular
```

## Quick Start (Standalone API - Angular 17+)

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideKitbase } from '@kitbase/analytics-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideKitbase({
      token: 'your-api-key',
      debug: true,
    }),
  ],
};
```

```typescript
// component.ts
import { Component } from '@angular/core';
import { KitbaseService } from '@kitbase/analytics-angular';

@Component({
  selector: 'app-button',
  template: '<button (click)="onClick()">Click me</button>',
})
export class ButtonComponent {
  constructor(private kitbase: KitbaseService) {}

  onClick() {
    this.kitbase.track({
      channel: 'ui',
      event: 'Button Clicked',
    });
  }
}
```

## API Reference

### Provider

#### `provideKitbase(options)`

Provide Kitbase analytics for standalone Angular applications.

```typescript
provideKitbase({
  token: 'your-api-key',
  debug: true,
  analytics: {
    autoTrackSessions: true,
  },
})
```

### Service Methods

#### Event Tracking

| Method | Description |
|--------|-------------|
| `track(options)` | Track a custom event |
| `trackPageView(options?)` | Track a page view |
| `trackRevenue(options)` | Track a revenue event |
| `trackOutboundLink(options)` | Track an outbound link click |

#### User Identification

| Method | Description |
|--------|-------------|
| `identify(options)` | Identify a user |
| `getUserId()` | Get the identified user ID |
| `getAnonymousId()` | Get the anonymous ID |
| `reset()` | Reset user identity and session |

#### Super Properties

| Method | Description |
|--------|-------------|
| `register(properties)` | Set super properties |
| `registerOnce(properties)` | Set super properties if not already set |
| `unregister(key)` | Remove a super property |
| `getSuperProperties()` | Get all super properties |
| `clearSuperProperties()` | Clear all super properties |

#### Time Events

| Method | Description |
|--------|-------------|
| `timeEvent(eventName)` | Start timing an event |
| `cancelTimeEvent(eventName)` | Cancel timing an event |
| `getTimedEvents()` | Get all timed events |
| `getEventDuration(eventName)` | Get duration of a timed event |

#### Session

| Method | Description |
|--------|-------------|
| `getSessionId()` | Get current session ID |
| `getSession()` | Get current session data |

#### Privacy & Consent

| Method | Description |
|--------|-------------|
| `optOut()` | Opt out of tracking |
| `optIn()` | Opt in to tracking |
| `isOptedOut()` | Check if tracking is opted out |
| `hasConsent()` | Check if user has consented |

### Examples

#### Track Events

```typescript
@Component({ ... })
export class ProductComponent {
  constructor(private kitbase: KitbaseService) {}

  addToCart(productId: string) {
    this.kitbase.track({
      channel: 'ecommerce',
      event: 'Add to Cart',
      tags: { product_id: productId },
    });
  }
}
```

#### Identify Users

```typescript
@Component({ ... })
export class AuthService {
  constructor(private kitbase: KitbaseService) {}

  async login(user: User) {
    // ... login logic
    await this.kitbase.identify({
      userId: user.id,
      traits: { email: user.email, plan: user.plan },
    });
  }

  logout() {
    // ... logout logic
    this.kitbase.reset();
  }
}
```

#### Track Route Changes

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { initRouteTracking } from '@kitbase/analytics-angular';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {
  constructor() {
    initRouteTracking();
  }
}
```

#### Track Duration

```typescript
@Component({ ... })
export class VideoComponent {
  constructor(private kitbase: KitbaseService) {}

  onPlay() {
    this.kitbase.timeEvent('Video Watched');
  }

  onEnd() {
    this.kitbase.track({
      channel: 'engagement',
      event: 'Video Watched',
      tags: { video_id: this.videoId },
    });
    // $duration automatically included
  }
}
```

#### Consent Management

```typescript
@Component({
  template: `
    <div *ngIf="showBanner">
      <p>We use analytics to improve your experience</p>
      <button (click)="accept()">Accept</button>
      <button (click)="reject()">Reject</button>
    </div>
  `,
})
export class CookieBannerComponent {
  showBanner = true;

  constructor(private kitbase: KitbaseService) {
    this.showBanner = !this.kitbase.hasConsent();
  }

  accept() {
    this.kitbase.optIn();
    this.showBanner = false;
  }

  reject() {
    this.kitbase.optOut();
    this.showBanner = false;
  }
}
```

## License

MIT
