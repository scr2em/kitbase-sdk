<?php

declare(strict_types=1);

namespace Kitbase\Flags;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;

/**
 * Kitbase Feature Flags client for evaluating feature flags
 *
 * @example
 * ```php
 * use Kitbase\Flags\Flags;
 * use Kitbase\Flags\FlagsConfig;
 * use Kitbase\Flags\EvaluationContext;
 *
 * $flags = new Flags(new FlagsConfig(
 *     token: '<YOUR_API_KEY>',
 * ));
 *
 * // Simple boolean check
 * $isEnabled = $flags->getBooleanValue('dark-mode', false, new EvaluationContext(
 *     targetingKey: 'user-123',
 *     attributes: ['plan' => 'premium'],
 * ));
 *
 * // Get full resolution details
 * $result = $flags->getBooleanDetails('dark-mode', false, new EvaluationContext(
 *     targetingKey: 'user-123',
 * ));
 * echo $result->value; // true/false
 * echo $result->reason->value; // 'TARGETING_MATCH'
 * ```
 */
class Flags
{
    private const BASE_URL = 'https://api.kitbase.dev';
    private const TIMEOUT = 30;

    private readonly string $token;
    private readonly HttpClient $httpClient;

    public function __construct(FlagsConfig $config, ?HttpClient $httpClient = null)
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
     * Get a snapshot of all evaluated feature flags
     *
     * @param EvaluationContext|null $context Evaluation context for targeting
     * @return FlagSnapshot The flag snapshot
     * @throws AuthenticationException When the API key is invalid
     * @throws ApiException When the API returns an error
     * @throws TimeoutException When the request times out
     */
    public function getSnapshot(?EvaluationContext $context = null): FlagSnapshot
    {
        $payload = $context?->toPayload() ?? [];
        $response = $this->request('/v1/feature-flags/snapshot', $payload);

        return FlagSnapshot::fromArray($response);
    }

    /**
     * Evaluate a single feature flag with full resolution details
     *
     * @param string $flagKey The key of the flag to evaluate
     * @param EvaluationContext|null $context Evaluation context for targeting
     * @param mixed $defaultValue Default value to return if flag cannot be evaluated
     * @return EvaluatedFlag The evaluated flag with resolution details
     * @throws ValidationException When flagKey is missing
     * @throws AuthenticationException When the API key is invalid
     * @throws ApiException When the API returns an error
     * @throws TimeoutException When the request times out
     */
    public function evaluateFlag(
        string $flagKey,
        ?EvaluationContext $context = null,
        mixed $defaultValue = null
    ): EvaluatedFlag {
        if (empty($flagKey)) {
            throw new ValidationException('Flag key is required', 'flagKey');
        }

        $payload = array_merge(
            ['flagKey' => $flagKey],
            $context?->toPayload() ?? []
        );

        if ($defaultValue !== null) {
            $payload['defaultValue'] = $defaultValue;
        }

        $response = $this->request('/v1/feature-flags/evaluate', $payload);

        return EvaluatedFlag::fromArray($response);
    }

    /**
     * Get a boolean flag value
     *
     * @param string $flagKey The key of the flag to evaluate
     * @param bool $defaultValue Default value if flag cannot be evaluated
     * @param EvaluationContext|null $context Optional evaluation context
     * @return bool The boolean value
     * @throws TypeMismatchException When the flag is not a boolean type
     */
    public function getBooleanValue(
        string $flagKey,
        bool $defaultValue,
        ?EvaluationContext $context = null
    ): bool {
        $details = $this->getBooleanDetails($flagKey, $defaultValue, $context);
        return $details->value;
    }

    /**
     * Get a boolean flag value with full resolution details
     *
     * @param string $flagKey The key of the flag to evaluate
     * @param bool $defaultValue Default value if flag cannot be evaluated
     * @param EvaluationContext|null $context Optional evaluation context
     * @return ResolutionDetails<bool> Resolution details with boolean value
     */
    public function getBooleanDetails(
        string $flagKey,
        bool $defaultValue,
        ?EvaluationContext $context = null
    ): ResolutionDetails {
        $flag = $this->evaluateFlag($flagKey, $context, $defaultValue);
        return $this->toResolutionDetails($flag, $defaultValue, FlagValueType::BOOLEAN);
    }

    /**
     * Get a string flag value
     *
     * @param string $flagKey The key of the flag to evaluate
     * @param string $defaultValue Default value if flag cannot be evaluated
     * @param EvaluationContext|null $context Optional evaluation context
     * @return string The string value
     * @throws TypeMismatchException When the flag is not a string type
     */
    public function getStringValue(
        string $flagKey,
        string $defaultValue,
        ?EvaluationContext $context = null
    ): string {
        $details = $this->getStringDetails($flagKey, $defaultValue, $context);
        return $details->value;
    }

    /**
     * Get a string flag value with full resolution details
     *
     * @param string $flagKey The key of the flag to evaluate
     * @param string $defaultValue Default value if flag cannot be evaluated
     * @param EvaluationContext|null $context Optional evaluation context
     * @return ResolutionDetails<string> Resolution details with string value
     */
    public function getStringDetails(
        string $flagKey,
        string $defaultValue,
        ?EvaluationContext $context = null
    ): ResolutionDetails {
        $flag = $this->evaluateFlag($flagKey, $context, $defaultValue);
        return $this->toResolutionDetails($flag, $defaultValue, FlagValueType::STRING);
    }

    /**
     * Get a number flag value
     *
     * @param string $flagKey The key of the flag to evaluate
     * @param int|float $defaultValue Default value if flag cannot be evaluated
     * @param EvaluationContext|null $context Optional evaluation context
     * @return int|float The number value
     * @throws TypeMismatchException When the flag is not a number type
     */
    public function getNumberValue(
        string $flagKey,
        int|float $defaultValue,
        ?EvaluationContext $context = null
    ): int|float {
        $details = $this->getNumberDetails($flagKey, $defaultValue, $context);
        return $details->value;
    }

    /**
     * Get a number flag value with full resolution details
     *
     * @param string $flagKey The key of the flag to evaluate
     * @param int|float $defaultValue Default value if flag cannot be evaluated
     * @param EvaluationContext|null $context Optional evaluation context
     * @return ResolutionDetails<int|float> Resolution details with number value
     */
    public function getNumberDetails(
        string $flagKey,
        int|float $defaultValue,
        ?EvaluationContext $context = null
    ): ResolutionDetails {
        $flag = $this->evaluateFlag($flagKey, $context, $defaultValue);
        return $this->toResolutionDetails($flag, $defaultValue, FlagValueType::NUMBER);
    }

    /**
     * Get a JSON/object flag value
     *
     * @param string $flagKey The key of the flag to evaluate
     * @param array<mixed>|object $defaultValue Default value if flag cannot be evaluated
     * @param EvaluationContext|null $context Optional evaluation context
     * @return array<mixed>|object The JSON value
     * @throws TypeMismatchException When the flag is not a json type
     */
    public function getJsonValue(
        string $flagKey,
        array|object $defaultValue,
        ?EvaluationContext $context = null
    ): array|object {
        $details = $this->getJsonDetails($flagKey, $defaultValue, $context);
        return $details->value;
    }

    /**
     * Get a JSON/object flag value with full resolution details
     *
     * @param string $flagKey The key of the flag to evaluate
     * @param array<mixed>|object $defaultValue Default value if flag cannot be evaluated
     * @param EvaluationContext|null $context Optional evaluation context
     * @return ResolutionDetails<array<mixed>|object> Resolution details with JSON value
     */
    public function getJsonDetails(
        string $flagKey,
        array|object $defaultValue,
        ?EvaluationContext $context = null
    ): ResolutionDetails {
        $flag = $this->evaluateFlag($flagKey, $context, $defaultValue);
        return $this->toResolutionDetails($flag, $defaultValue, FlagValueType::JSON);
    }

    /**
     * Convert API response to typed resolution details
     *
     * @template T
     * @param EvaluatedFlag $flag The evaluated flag from API
     * @param T $defaultValue Default value to use if needed
     * @param FlagValueType $expectedType Expected value type
     * @return ResolutionDetails<T>
     */
    private function toResolutionDetails(
        EvaluatedFlag $flag,
        mixed $defaultValue,
        FlagValueType $expectedType
    ): ResolutionDetails {
        // Check for errors from the API
        if ($flag->errorCode === ErrorCode::FLAG_NOT_FOUND) {
            return new ResolutionDetails(
                value: $defaultValue,
                reason: ResolutionReason::ERROR,
                errorCode: ErrorCode::FLAG_NOT_FOUND,
                errorMessage: $flag->errorMessage,
                flagMetadata: $flag->flagMetadata,
            );
        }

        // Type validation
        if ($flag->valueType !== $expectedType) {
            throw new TypeMismatchException(
                $flag->flagKey,
                $expectedType->value,
                $flag->valueType->value
            );
        }

        // Handle disabled flags
        if (!$flag->enabled || $flag->value === null) {
            return new ResolutionDetails(
                value: $defaultValue,
                variant: $flag->variant,
                reason: $flag->reason,
                errorCode: $flag->errorCode,
                errorMessage: $flag->errorMessage,
                flagMetadata: $flag->flagMetadata,
            );
        }

        return new ResolutionDetails(
            value: $flag->value,
            variant: $flag->variant,
            reason: $flag->reason,
            errorCode: $flag->errorCode,
            errorMessage: $flag->errorMessage,
            flagMetadata: $flag->flagMetadata,
        );
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
                'json' => $body ?: new \stdClass(), // Send empty object if no body
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
                $flagKey = $this->extractFlagKeyFromError($errorBody);
                if ($flagKey !== null) {
                    throw new FlagNotFoundException($flagKey, $e);
                }
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

    private function extractFlagKeyFromError(mixed $body): ?string
    {
        if (is_array($body) && isset($body['flagKey']) && is_string($body['flagKey'])) {
            return $body['flagKey'];
        }
        return null;
    }
}



