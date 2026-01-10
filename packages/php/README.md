# kitbase/sdk

Official Kitbase SDK for PHP. Fully typed with modern PHP 8.1+ syntax.

## Installation

```bash
composer require kitbase/sdk
```

## Features

Import only what you need:

```php
use Kitbase\Events\Kitbase;
use Kitbase\Changelogs\Changelogs;
use Kitbase\Flags\Flags;
```

---

## Events

Track events and logs in your application.

```php
use Kitbase\Events\Kitbase;
use Kitbase\Events\KitbaseConfig;
use Kitbase\Events\TrackOptions;

$kitbase = new Kitbase(new KitbaseConfig(
    token: '<YOUR_API_KEY>',
));

$response = $kitbase->track(new TrackOptions(
    event: 'New Subscription',
    channel: 'payments',
    userId: 'user-123',
    icon: '💰',
    notify: true,
    description: 'User subscribed to premium plan',
    tags: [
        'plan' => 'premium',
        'cycle' => 'monthly',
        'trial' => false,
    ],
));

echo $response->id;        // Event ID
echo $response->event;     // 'New Subscription'
echo $response->timestamp; // Server timestamp
```

### `$kitbase->track(TrackOptions $options)`

| Option              | Type                                 | Required | Description              |
| ------------------- | ------------------------------------ | -------- | ------------------------ |
| `event`             | `string`                             | ✅       | Event name               |
| `channel`           | `?string`                            | –        | Channel/category         |
| `userId`            | `?string`                            | –        | User identifier          |
| `icon`              | `?string`                            | –        | Emoji or icon name       |
| `notify`            | `?bool`                              | –        | Send notification        |
| `description`       | `?string`                            | –        | Event description        |
| `tags`              | `?array<string, string\|int\|bool>`  | –        | Additional metadata      |
| `includeAnonymousId`| `bool`                               | –        | Include anonymous ID (default: true) |

#### Anonymous User Tracking

The SDK automatically generates and persists an `anonymous_id` for tracking users before they log in. After login, provide the `userId` and Kitbase will automatically link it with the anonymous identity for accurate MAU counting.

```php
// Before login - SDK uses anonymous_id automatically
$kitbase->track(new TrackOptions(
    event: 'App Opened',
    channel: 'onboarding',
));

// After login - provide userId to link identities
$kitbase->track(new TrackOptions(
    event: 'User Logged In',
    channel: 'auth',
    userId: 'user-123',
));

// Get the anonymous ID if needed
$anonymousId = $kitbase->getAnonymousId();
```

---

## Changelogs

Fetch version changelogs for your application.

```php
use Kitbase\Changelogs\Changelogs;
use Kitbase\Changelogs\ChangelogsConfig;

$changelogs = new Changelogs(new ChangelogsConfig(
    token: '<YOUR_API_KEY>',
));

$changelog = $changelogs->get('1.0.0');
echo $changelog->version;  // '1.0.0'
echo $changelog->markdown; // Changelog content
```

### `$changelogs->get(string $version)`

Get a published changelog by version.

```php
$changelog = $changelogs->get('1.0.0');
```

**Returns:** `ChangelogResponse`

```php
class ChangelogResponse {
    public readonly string $id;
    public readonly string $version;
    public readonly string $markdown;      // Changelog content in Markdown format
    public readonly bool $isPublished;
    public readonly string $projectId;
    public readonly string $createdAt;
    public readonly string $updatedAt;
}
```

---

## Feature Flags

Evaluate feature flags in your application.

```php
use Kitbase\Flags\Flags;
use Kitbase\Flags\FlagsConfig;
use Kitbase\Flags\EvaluationContext;

$flags = new Flags(new FlagsConfig(
    token: '<YOUR_API_KEY>',
));

// Simple boolean check
$isEnabled = $flags->getBooleanValue('dark-mode', false, new EvaluationContext(
    targetingKey: 'user-123',
    attributes: ['plan' => 'premium'],
));

// Get full resolution details
$result = $flags->getBooleanDetails('dark-mode', false, new EvaluationContext(
    targetingKey: 'user-123',
));
echo $result->value;         // true/false
echo $result->reason->value; // 'TARGETING_MATCH'
```

### Flag Value Methods

```php
// Boolean flags
$boolValue = $flags->getBooleanValue('flag-key', $defaultValue, $context);
$boolDetails = $flags->getBooleanDetails('flag-key', $defaultValue, $context);

// String flags
$strValue = $flags->getStringValue('flag-key', $defaultValue, $context);
$strDetails = $flags->getStringDetails('flag-key', $defaultValue, $context);

// Number flags
$numValue = $flags->getNumberValue('flag-key', $defaultValue, $context);
$numDetails = $flags->getNumberDetails('flag-key', $defaultValue, $context);

// JSON flags
$jsonValue = $flags->getJsonValue('flag-key', $defaultValue, $context);
$jsonDetails = $flags->getJsonDetails('flag-key', $defaultValue, $context);

// Get all flags at once
$snapshot = $flags->getSnapshot($context);
```

### Evaluation Context

The evaluation context is used for targeting and percentage rollouts:

```php
$context = new EvaluationContext(
    targetingKey: 'user-123',  // Required for percentage rollouts
    attributes: [
        'plan' => 'premium',   // Custom attribute for targeting
        'country' => 'US',     // Custom attribute for targeting
        'age' => 25,           // Supports any JSON-serializable value
    ],
);
```

---

## Error Handling

Each module exports typed exception classes:

### Events Exceptions

```php
use Kitbase\Events\KitbaseException;
use Kitbase\Events\AuthenticationException;
use Kitbase\Events\ApiException;
use Kitbase\Events\ValidationException;
use Kitbase\Events\TimeoutException;
```

### Changelogs Exceptions

```php
use Kitbase\Changelogs\ChangelogsException;
use Kitbase\Changelogs\AuthenticationException;
use Kitbase\Changelogs\ApiException;
use Kitbase\Changelogs\NotFoundException;
use Kitbase\Changelogs\ValidationException;
use Kitbase\Changelogs\TimeoutException;
```

### Flags Exceptions

```php
use Kitbase\Flags\FlagsException;
use Kitbase\Flags\AuthenticationException;
use Kitbase\Flags\ApiException;
use Kitbase\Flags\ValidationException;
use Kitbase\Flags\TimeoutException;
use Kitbase\Flags\FlagNotFoundException;
use Kitbase\Flags\TypeMismatchException;
```

### Example

```php
use Kitbase\Changelogs\NotFoundException;
use Kitbase\Changelogs\AuthenticationException;

try {
    $changelog = $changelogs->get('1.0.0');
} catch (NotFoundException $e) {
    echo "Version {$e->version} not found";
} catch (AuthenticationException $e) {
    echo 'Invalid API key';
}
```

---

## Requirements

- PHP 8.1 or later
- A Kitbase API key

## License

MIT








