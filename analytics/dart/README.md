# Kitbase Analytics SDK for Dart & Flutter

A robust, offline-first analytics SDK with plug-and-play support for Mobile and Web.

## Features

- **Offline Support**: Events are queued locally (via Sembast) when offline and synced when online.
- **Web Support**: Uses native IndexedDB (Zero configuration - no WASM assets or server headers required).
- **Auto-Retry**: Automatically retries failed logs with exponential backoff.
- **Session Tracking**: Automatic session management.
- **User Identity**: Identify users and set super properties.
- **Thread Safe**: Handles concurrent writes and logic safely.

## Installation

Add to your `pubspec.yaml`:

```yaml
dependencies:
  kitbase_analytics: ^0.1.0
```

## Usage

### 1. Initialization

Initialize the SDK once at the start of your application:

```dart
import 'package:kitbase_analytics/kitbase_analytics.dart';

void main() async {
  // Initialize the singleton
  KitbaseAnalytics.init(KitbaseConfig(
    token: 'YOUR_API_TOKEN',
    baseUrl: 'https://api.kitbase.dev', // Optional, defaults to production
    debug: true, // Enable debug logging
  ));
  
  runApp(MyApp());
}
```

### 2. Tracking Events

Use the static methods or singleton instance to track events anywhere:

```dart
// Simple event tracking
await KitbaseAnalytics.track(TrackOptions(
  channel: 'marketing',
  event: 'Sign Up Clicked',
));

// Event with properties (tags)
await KitbaseAnalytics.track(TrackOptions(
  channel: 'ecommerce',
  event: 'Item Purchased',
  tags: {
    'item_id': 'prod_123',
    'price': 29.99,
    'currency': 'USD',
  },
));
```

### 3. User Identification

Identify users to link events to specific user profiles:

```dart
// Identify a user
KitbaseAnalytics.identify(IdentifyOptions(
  userId: 'user_5678',
  traits: {
    'plan': 'premium',
    'role': 'admin',
  },
));
```

### 4. Reset User Identity

To clear the current user identity (e.g., on logout):

```dart
KitbaseAnalytics.unidentify();
```

### 5. Super Properties

Register properties that are effectively "global" and sent with every event:

```dart
// Register properties included with all future events
KitbaseAnalytics.registerSuperPropertie({
  'app_version': '1.0.0',
  'environment': 'production',
});
```

### 6. Privacy & Consent

Handle user opt-outs for privacy compliance (GDPR/CCPA):

```dart
// unexpected user opt-out
await KitbaseAnalytics.optOut();

// Check status
if (KitbaseAnalytics.isOptedOut()) {
  // ...
}

// User opt-in
await KitbaseAnalytics.optIn();
```
