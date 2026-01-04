<?php

declare(strict_types=1);

namespace Kitbase\Changelogs;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;

/**
 * Changelogs client for fetching version changelogs
 *
 * @example
 * ```php
 * use Kitbase\Changelogs\Changelogs;
 * use Kitbase\Changelogs\ChangelogsConfig;
 *
 * $changelogs = new Changelogs(new ChangelogsConfig(
 *     token: '<YOUR_API_KEY>',
 * ));
 *
 * $changelog = $changelogs->get('1.0.0');
 * echo $changelog->version;
 * echo $changelog->markdown;
 * ```
 */
class Changelogs
{
    private const BASE_URL = 'https://api.kitbase.dev';
    private const TIMEOUT = 30;

    private readonly string $token;
    private readonly HttpClient $httpClient;

    public function __construct(ChangelogsConfig $config, ?HttpClient $httpClient = null)
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
     * Get a changelog by version
     *
     * @param string $version Version string (e.g., "1.0.0", "2.3.1")
     * @return ChangelogResponse The changelog
     * @throws ValidationException When version is missing
     * @throws AuthenticationException When the API key is invalid
     * @throws NotFoundException When the changelog is not found
     * @throws ApiException When the API returns an error
     * @throws TimeoutException When the request times out
     */
    public function get(string $version): ChangelogResponse
    {
        if (empty($version)) {
            throw new ValidationException('Version is required', 'version');
        }

        $response = $this->request('/v1/changelogs/' . urlencode($version));

        return ChangelogResponse::fromArray($response);
    }

    /**
     * @return array<string, mixed>
     */
    private function request(string $endpoint): array
    {
        try {
            $response = $this->httpClient->get($endpoint, [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $this->token,
                ],
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

            if ($statusCode === 404) {
                // Extract version from endpoint
                $parts = explode('/', $endpoint);
                $version = urldecode(end($parts) ?: '');
                throw new NotFoundException($version);
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






