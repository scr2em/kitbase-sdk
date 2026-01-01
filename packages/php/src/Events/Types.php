<?php

declare(strict_types=1);

namespace Kitbase\Events;

/**
 * Configuration options for the Kitbase client
 */
class KitbaseConfig
{
    /**
     * @param string $token Your Kitbase API key
     */
    public function __construct(
        public readonly string $token,
    ) {}
}

/**
 * Options for tracking an event
 */
class TrackOptions
{
    /**
     * @param string $channel The channel/category for the event (e.g., 'payments', 'auth', 'users')
     * @param string $event The name of the event (e.g., 'New Subscription', 'User Signed Up')
     * @param string|null $userId Optional user identifier
     * @param string|null $icon Icon for the event (emoji or icon name, e.g., '💰', 'money_bag')
     * @param bool|null $notify Whether to send a notification for this event
     * @param string|null $description Optional description for the event
     * @param array<string, string|int|float|bool>|null $tags Additional metadata tags
     */
    public function __construct(
        public readonly string $channel,
        public readonly string $event,
        public readonly ?string $userId = null,
        public readonly ?string $icon = null,
        public readonly ?bool $notify = null,
        public readonly ?string $description = null,
        public readonly ?array $tags = null,
    ) {}

    /**
     * Convert to API payload array
     *
     * @return array<string, mixed>
     */
    public function toPayload(): array
    {
        $payload = [
            'channel' => $this->channel,
            'event' => $this->event,
        ];

        if ($this->userId !== null) {
            $payload['user_id'] = $this->userId;
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

