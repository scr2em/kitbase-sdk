<?php

declare(strict_types=1);

namespace Kitbase\Events;

use Exception;
use Throwable;

/**
 * Base exception class for Kitbase SDK errors
 */
class KitbaseException extends Exception
{
    public function __construct(string $message = '', int $code = 0, ?Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Exception thrown when API authentication fails
 */
class AuthenticationException extends KitbaseException
{
    public function __construct(string $message = 'Invalid API key', int $code = 401, ?Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Exception thrown when the API request fails
 */
class ApiException extends KitbaseException
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
class ValidationException extends KitbaseException
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
class TimeoutException extends KitbaseException
{
    public function __construct(string $message = 'Request timed out', ?Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }
}








