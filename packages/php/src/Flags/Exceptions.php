<?php

declare(strict_types=1);

namespace Kitbase\Flags;

use Exception;
use Throwable;

/**
 * Base exception class for Kitbase Flags SDK errors
 */
class FlagsException extends Exception
{
    public function __construct(string $message = '', int $code = 0, ?Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Exception thrown when API authentication fails
 */
class AuthenticationException extends FlagsException
{
    public function __construct(string $message = 'Invalid API key', int $code = 401, ?Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Exception thrown when the API request fails
 */
class ApiException extends FlagsException
{
    public readonly int $statusCode;
    public readonly mixed $response;

    public function __construct(
        string $message,
        int $statusCode,
        mixed $response = null,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $statusCode, $previous);
        $this->statusCode = $statusCode;
        $this->response = $response;
    }
}

/**
 * Exception thrown when request validation fails
 */
class ValidationException extends FlagsException
{
    public readonly ?string $field;

    public function __construct(string $message, ?string $field = null, ?Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
        $this->field = $field;
    }
}

/**
 * Exception thrown when a request times out
 */
class TimeoutException extends FlagsException
{
    public function __construct(string $message = 'Request timed out', ?Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }
}

/**
 * Exception thrown when a feature flag is not found
 * OpenFeature error code: FLAG_NOT_FOUND
 */
class FlagNotFoundException extends FlagsException
{
    public readonly string $flagKey;

    public function __construct(string $flagKey, ?Throwable $previous = null)
    {
        parent::__construct("Flag '{$flagKey}' not found", 404, $previous);
        $this->flagKey = $flagKey;
    }
}

/**
 * Exception thrown when the requested type doesn't match the flag's value type
 * OpenFeature error code: TYPE_MISMATCH
 */
class TypeMismatchException extends FlagsException
{
    public readonly string $flagKey;
    public readonly string $expectedType;
    public readonly string $actualType;

    public function __construct(
        string $flagKey,
        string $expectedType,
        string $actualType,
        ?Throwable $previous = null
    ) {
        parent::__construct(
            "Type mismatch for flag '{$flagKey}': expected {$expectedType}, got {$actualType}",
            0,
            $previous
        );
        $this->flagKey = $flagKey;
        $this->expectedType = $expectedType;
        $this->actualType = $actualType;
    }
}

/**
 * Exception thrown when evaluation context is invalid
 * OpenFeature error code: INVALID_CONTEXT
 */
class InvalidContextException extends FlagsException
{
    public function __construct(string $message, ?Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }
}

/**
 * Exception thrown when parsing flag configuration fails
 * OpenFeature error code: PARSE_ERROR
 */
class ParseException extends FlagsException
{
    public function __construct(string $message, ?Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }
}


