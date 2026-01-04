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
// use Kitbase\Flags\Flags;  // coming soon
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
    channel: 'payments',
    event: 'New Subscription',
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

| Option        | Type                                 | Required | Description              |
| ------------- | ------------------------------------ | -------- | ------------------------ |
| `channel`     | `string`                             | ✅       | Channel/category         |
| `event`       | `string`                             | ✅       | Event name               |
| `userId`      | `?string`                            | –        | User identifier          |
| `icon`        | `?string`                            | –        | Emoji or icon name       |
| `notify`      | `?bool`                              | –        | Send notification        |
| `description` | `?string`                            | –        | Event description        |
| `tags`        | `?array<string, string\|int\|bool>`  | –        | Additional metadata      |

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






