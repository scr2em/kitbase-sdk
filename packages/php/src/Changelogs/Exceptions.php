<?php

declare(strict_types=1);

namespace Kitbase\Changelogs;

use Exception;
use Throwable;

/**
 * Base exception class for Changelogs SDK errors
 */
class ChangelogsException extends Exception
{
    public function __construct(string $message = '', int $code = 0, ?Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Exception thrown when API authentication fails
 */
class AuthenticationException extends ChangelogsException
{
    public function __construct(string $message = 'Invalid API key', int $code = 401, ?Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Exception thrown when the API request fails
 */
class ApiException extends ChangelogsException
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
 * Exception thrown when a changelog is not found
 */
class NotFoundException extends ChangelogsException
{
    public readonly string $version;

    public function __construct(string $version, ?string $message = null, ?Throwable $previous = null)
    {
        $this->version = $version;
        parent::__construct($message ?? "Changelog not found for version: {$version}", 404, $previous);
    }
}

/**
 * Exception thrown when request validation fails
 */
class ValidationException extends ChangelogsException
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
class TimeoutException extends ChangelogsException
{
    public function __construct(string $message = 'Request timed out', ?Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }
}








