<?php

declare(strict_types=1);

namespace Kitbase\Events;

/**
 * Storage interface for anonymous ID persistence
 */
interface Storage
{
    public function getItem(string $key): ?string;
    public function setItem(string $key, string $value): void;
    public function removeItem(string $key): void;
}

/**
 * In-memory storage implementation
 */
class MemoryStorage implements Storage
{
    /** @var array<string, string> */
    private array $data = [];

    public function getItem(string $key): ?string
    {
        return $this->data[$key] ?? null;
    }

    public function setItem(string $key, string $value): void
    {
        $this->data[$key] = $value;
    }

    public function removeItem(string $key): void
    {
        unset($this->data[$key]);
    }
}

/**
 * Configuration options for the Kitbase client
 */
class KitbaseConfig
{
    /**
     * @param string $token Your Kitbase API key
     * @param string|null $baseUrl Override the default API endpoint
     * @param Storage|null $storage Custom storage for anonymous ID persistence. Set to null to disable persistence.
     * @param string $storageKey Storage key for the anonymous ID
     */
    public function __construct(
        public readonly string $token,
        public readonly ?string $baseUrl = null,
        public readonly ?Storage $storage = null,
        public readonly string $storageKey = 'kitbase_anonymous_id',
    ) {}
}

/**
 * Options for tracking an event
 */
class TrackOptions
{
    /**
     * @param string $event The name of the event (e.g., 'New Subscription', 'User Signed Up')
     * @param string|null $channel The channel/category for the event (e.g., 'payments', 'auth', 'users')
     * @param string|null $userId Optional user identifier
     * @param string|null $icon Icon for the event (emoji or icon name, e.g., '💰', 'money_bag')
     * @param bool|null $notify Whether to send a notification for this event
     * @param string|null $description Optional description for the event
     * @param array<string, string|int|float|bool>|null $tags Additional metadata tags
     * @param bool $includeAnonymousId Whether to include the anonymous ID in this event
     */
    public function __construct(
        public readonly string $event,
        public readonly ?string $channel = null,
        public readonly ?string $userId = null,
        public readonly ?string $icon = null,
        public readonly ?bool $notify = null,
        public readonly ?string $description = null,
        public readonly ?array $tags = null,
        public readonly bool $includeAnonymousId = true,
    ) {}

    /**
     * Convert to API payload array
     *
     * @param string|null $anonymousId Anonymous ID to include in payload
     * @return array<string, mixed>
     */
    public function toPayload(?string $anonymousId = null): array
    {
        $payload = [
            'event' => $this->event,
        ];

        if ($this->channel !== null) {
            $payload['channel'] = $this->channel;
        }

        if ($this->userId !== null) {
            $payload['user_id'] = $this->userId;
        }

        if ($this->includeAnonymousId && $anonymousId !== null) {
            $payload['anonymous_id'] = $anonymousId;
        }

        if ($this->icon !== null) {
            $payload['icon'] = $this->icon;
        }

        if ($this->notify !== null) {
            $payload['notify'] = $this->notify;
        }

        if ($this->description !== null) {
            $payload['description'] = $this->description;
        }

        if ($this->tags !== null) {
            $payload['tags'] = $this->tags;
        }

        return $payload;
    }
}

/**
 * Response from the track API
 */
class TrackResponse
{
    /**
     * @param string $id Unique identifier for the logged event
     * @param string $event The event name
     * @param string $timestamp Server timestamp when the event was recorded
     */
    public function __construct(
        public readonly string $id,
        public readonly string $event,
        public readonly string $timestamp,
    ) {}

    /**
     * Create from API response array
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: (string) ($data['id'] ?? ''),
            event: (string) ($data['event'] ?? ''),
            timestamp: (string) ($data['timestamp'] ?? ''),
        );
    }
}








