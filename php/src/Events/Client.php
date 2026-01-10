<?php

declare(strict_types=1);

namespace Kitbase\Events;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use Ramsey\Uuid\Uuid;

/**
 * Kitbase client for tracking events
 *
 * @example
 * ```php
 * use Kitbase\Events\Kitbase;
 * use Kitbase\Events\KitbaseConfig;
 * use Kitbase\Events\TrackOptions;
 *
 * $kitbase = new Kitbase(new KitbaseConfig(
 *     token: '<YOUR_API_KEY>',
 * ));
 *
 * // Track anonymous events (anonymous_id is automatically included)
 * $response = $kitbase->track(new TrackOptions(
 *     event: 'Page Viewed',
 *     icon: '👀',
 * ));
 *
 * // Track events for a logged-in user
 * $response = $kitbase->track(new TrackOptions(
 *     event: 'New Subscription',
 *     channel: 'payments',
 *     userId: 'user-123',
 *     icon: '💰',
 *     notify: true,
 *     tags: [
 *         'plan' => 'premium',
 *         'cycle' => 'monthly',
 *     ],
 * ));
 * ```
 */
class Kitbase
{
    private const DEFAULT_BASE_URL = 'https://api.kitbase.dev';
    private const TIMEOUT = 30;

    private readonly string $token;
    private readonly string $baseUrl;
    private readonly HttpClient $httpClient;
    private readonly ?Storage $storage;
    private readonly string $storageKey;
    private ?string $anonymousId = null;

    public function __construct(KitbaseConfig $config, ?HttpClient $httpClient = null)
    {
        if (empty($config->token)) {
            throw new ValidationException('API token is required', 'token');
        }

        $this->token = $config->token;
        $this->baseUrl = $config->baseUrl ?? self::DEFAULT_BASE_URL;
        $this->storage = $config->storage ?? new MemoryStorage();
        $this->storageKey = $config->storageKey;
        $this->httpClient = $httpClient ?? new HttpClient([
            'base_uri' => $this->baseUrl,
            'timeout' => self::TIMEOUT,
        ]);

        $this->initializeAnonymousId();
    }

    /**
     * Initialize the anonymous ID from storage or generate a new one
     */
    private function initializeAnonymousId(): void
    {
        if ($this->storage !== null) {
            $stored = $this->storage->getItem($this->storageKey);
            if ($stored !== null) {
                $this->anonymousId = $stored;
                return;
            }
        }

        // Generate new anonymous ID (UUID v4)
        $this->anonymousId = Uuid::uuid4()->toString();

        // Persist if storage is available
        if ($this->storage !== null && $this->anonymousId !== null) {
            $this->storage->setItem($this->storageKey, $this->anonymousId);
        }
    }



    /**
     * Get the current anonymous ID
     */
    public function getAnonymousId(): ?string
    {
        return $this->anonymousId;
    }

    /**
     * Track an event
     *
     * @param TrackOptions $options Event tracking options
     * @return TrackResponse The track response
     * @throws ValidationException When required fields are missing
     * @throws AuthenticationException When the API key is invalid
     * @throws ApiException When the API returns an error
     * @throws TimeoutException When the request times out
     */
    public function track(TrackOptions $options): TrackResponse
    {
        $this->validateTrackOptions($options);

        $payload = $options->toPayload($this->anonymousId);
        $response = $this->request('/v1/logs', $payload);

        return TrackResponse::fromArray($response);
    }

    private function validateTrackOptions(TrackOptions $options): void
    {
        if (empty($options->event)) {
            throw new ValidationException('Event is required', 'event');
        }
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    private function request(string $endpoint, array $body): array
    {
        try {
            $response = $this->httpClient->post($endpoint, [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'x-api-key' => $this->token,
                ],
                'json' => $body,
            ]);

            /** @var array<string, mixed> */
            return json_decode($response->getBody()->getContents(), true) ?? [];
        } catch (ConnectException $e) {
            throw new TimeoutException('Request timed out', $e);
        } catch (RequestException $e) {
            $response = $e->getResponse();
            
            if ($response === null) {
                throw new ApiException($e->getMessage(), 0, null, $e);
            }

            $statusCode = $response->getStatusCode();
            $errorBody = $this->parseResponseBody($response->getBody()->getContents());

            if ($statusCode === 401) {
                throw new AuthenticationException();
            }

            throw new ApiException(
                $this->getErrorMessage($errorBody, $response->getReasonPhrase() ?? 'Unknown error'),
                $statusCode,
                $errorBody,
                $e
            );
        }
    }

    private function parseResponseBody(string $body): mixed
    {
        try {
            return json_decode($body, true);
        } catch (\Exception) {
            return null;
        }
    }

    private function getErrorMessage(mixed $body, string $fallback): string
    {
        if (is_array($body)) {
            if (isset($body['message']) && is_string($body['message'])) {
                return $body['message'];
            }
            if (isset($body['error']) && is_string($body['error'])) {
                return $body['error'];
            }
        }

        return $fallback;
    }
}
