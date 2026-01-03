<?php

declare(strict_types=1);

namespace Kitbase\Events;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;

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
 * $response = $kitbase->track(new TrackOptions(
 *     channel: 'payments',
 *     event: 'New Subscription',
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
    private const BASE_URL = 'https://api.kitbase.dev';
    private const TIMEOUT = 30;

    private readonly string $token;
    private readonly HttpClient $httpClient;

    public function __construct(KitbaseConfig $config, ?HttpClient $httpClient = null)
    {
        if (empty($config->token)) {
            throw new ValidationException('API token is required', 'token');
        }

        $this->token = $config->token;
        $this->httpClient = $httpClient ?? new HttpClient([
            'base_uri' => self::BASE_URL,
            'timeout' => self::TIMEOUT,
        ]);
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

        $payload = $options->toPayload();
        $response = $this->request('/v1/logs', $payload);

        return TrackResponse::fromArray($response);
    }

    private function validateTrackOptions(TrackOptions $options): void
    {
        if (empty($options->channel)) {
            throw new ValidationException('Channel is required', 'channel');
        }
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
                    'Authorization' => 'Bearer ' . $this->token,
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




