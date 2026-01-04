<?php

declare(strict_types=1);

namespace Kitbase\Flags;

/**
 * Configuration options for the Flags client
 */
class FlagsConfig
{
    /**
     * @param string $token Your Kitbase API key
     */
    public function __construct(
        public readonly string $token,
    ) {}
}

/**
 * Evaluation context for targeting and percentage rollouts
 */
class EvaluationContext
{
    /**
     * @param string|null $targetingKey Unique identifier for the user/device (used for percentage rollouts)
     * @param array<string, mixed> $attributes Additional context attributes for targeting rules
     */
    public function __construct(
        public readonly ?string $targetingKey = null,
        public readonly array $attributes = [],
    ) {}

    /**
     * Convert to API payload array
     *
     * @return array<string, mixed>
     */
    public function toPayload(): array
    {
        $payload = [];

        if ($this->targetingKey !== null) {
            $payload['identityId'] = $this->targetingKey;
        }

        if (!empty($this->attributes)) {
            $payload['context'] = $this->attributes;
        }

        return $payload;
    }
}

/**
 * OpenFeature-compatible resolution reasons
 */
enum ResolutionReason: string
{
    case STATIC = 'STATIC';
    case DEFAULT = 'DEFAULT';
    case TARGETING_MATCH = 'TARGETING_MATCH';
    case SPLIT = 'SPLIT';
    case CACHED = 'CACHED';
    case DISABLED = 'DISABLED';
    case UNKNOWN = 'UNKNOWN';
    case STALE = 'STALE';
    case ERROR = 'ERROR';

    public static function fromString(string $value): self
    {
        return match ($value) {
            'STATIC' => self::STATIC,
            'DEFAULT' => self::DEFAULT,
            'TARGETING_MATCH' => self::TARGETING_MATCH,
            'SPLIT' => self::SPLIT,
            'CACHED' => self::CACHED,
            'DISABLED' => self::DISABLED,
            'STALE' => self::STALE,
            'ERROR' => self::ERROR,
            default => self::UNKNOWN,
        };
    }
}

/**
 * OpenFeature-compatible error codes
 */
enum ErrorCode: string
{
    case PROVIDER_NOT_READY = 'PROVIDER_NOT_READY';
    case FLAG_NOT_FOUND = 'FLAG_NOT_FOUND';
    case PARSE_ERROR = 'PARSE_ERROR';
    case TYPE_MISMATCH = 'TYPE_MISMATCH';
    case TARGETING_KEY_MISSING = 'TARGETING_KEY_MISSING';
    case INVALID_CONTEXT = 'INVALID_CONTEXT';
    case GENERAL = 'GENERAL';

    public static function fromString(?string $value): ?self
    {
        if ($value === null) {
            return null;
        }

        return match ($value) {
            'PROVIDER_NOT_READY' => self::PROVIDER_NOT_READY,
            'FLAG_NOT_FOUND' => self::FLAG_NOT_FOUND,
            'PARSE_ERROR' => self::PARSE_ERROR,
            'TYPE_MISMATCH' => self::TYPE_MISMATCH,
            'TARGETING_KEY_MISSING' => self::TARGETING_KEY_MISSING,
            'INVALID_CONTEXT' => self::INVALID_CONTEXT,
            default => self::GENERAL,
        };
    }
}

/**
 * Flag value types
 */
enum FlagValueType: string
{
    case BOOLEAN = 'boolean';
    case STRING = 'string';
    case NUMBER = 'number';
    case JSON = 'json';

    public static function fromString(string $value): self
    {
        return match ($value) {
            'boolean' => self::BOOLEAN,
            'string' => self::STRING,
            'number' => self::NUMBER,
            'json' => self::JSON,
            default => self::STRING,
        };
    }
}

/**
 * OpenFeature-compatible resolution details
 *
 * @template T
 */
class ResolutionDetails
{
    /**
     * @param T $value The resolved flag value
     * @param string|null $variant OpenFeature variant identifier
     * @param ResolutionReason $reason Reason for the resolved value
     * @param ErrorCode|null $errorCode Error code if evaluation failed
     * @param string|null $errorMessage Human-readable error message
     * @param array<string, mixed>|null $flagMetadata Optional metadata about the flag
     */
    public function __construct(
        public readonly mixed $value,
        public readonly ?string $variant = null,
        public readonly ResolutionReason $reason = ResolutionReason::UNKNOWN,
        public readonly ?ErrorCode $errorCode = null,
        public readonly ?string $errorMessage = null,
        public readonly ?array $flagMetadata = null,
    ) {}
}

/**
 * A single evaluated feature flag from the API
 */
class EvaluatedFlag
{
    /**
     * @param string $flagKey Unique key for the flag
     * @param bool $enabled Whether the flag is enabled for this identity
     * @param FlagValueType $valueType The type of value this flag returns
     * @param mixed $value The evaluated value (type depends on valueType, null if disabled)
     * @param string|null $variant OpenFeature variant identifier
     * @param ResolutionReason $reason Reason for the resolved value
     * @param ErrorCode|null $errorCode Error code if evaluation failed
     * @param string|null $errorMessage Human-readable error message
     * @param array<string, mixed>|null $flagMetadata Optional metadata about the flag
     */
    public function __construct(
        public readonly string $flagKey,
        public readonly bool $enabled,
        public readonly FlagValueType $valueType,
        public readonly mixed $value,
        public readonly ?string $variant = null,
        public readonly ResolutionReason $reason = ResolutionReason::UNKNOWN,
        public readonly ?ErrorCode $errorCode = null,
        public readonly ?string $errorMessage = null,
        public readonly ?array $flagMetadata = null,
    ) {}

    /**
     * Create from API response array
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            flagKey: (string) ($data['flagKey'] ?? ''),
            enabled: (bool) ($data['enabled'] ?? false),
            valueType: FlagValueType::fromString((string) ($data['valueType'] ?? 'boolean')),
            value: $data['value'] ?? null,
            variant: isset($data['variant']) ? (string) $data['variant'] : null,
            reason: ResolutionReason::fromString((string) ($data['reason'] ?? 'UNKNOWN')),
            errorCode: ErrorCode::fromString($data['errorCode'] ?? null),
            errorMessage: isset($data['errorMessage']) ? (string) $data['errorMessage'] : null,
            flagMetadata: isset($data['flagMetadata']) && is_array($data['flagMetadata'])
                ? $data['flagMetadata']
                : null,
        );
    }
}

/**
 * Response from the snapshot API containing all evaluated flags
 */
class FlagSnapshot
{
    /**
     * @param string $projectId Project ID the flags belong to
     * @param string $environmentId Environment ID the flags were evaluated for
     * @param string $evaluatedAt Timestamp when the evaluation was performed
     * @param array<EvaluatedFlag> $flags List of evaluated feature flags
     */
    public function __construct(
        public readonly string $projectId,
        public readonly string $environmentId,
        public readonly string $evaluatedAt,
        public readonly array $flags,
    ) {}

    /**
     * Create from API response array
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $flags = [];
        if (isset($data['flags']) && is_array($data['flags'])) {
            foreach ($data['flags'] as $flagData) {
                if (is_array($flagData)) {
                    $flags[] = EvaluatedFlag::fromArray($flagData);
                }
            }
        }

        return new self(
            projectId: (string) ($data['projectId'] ?? ''),
            environmentId: (string) ($data['environmentId'] ?? ''),
            evaluatedAt: (string) ($data['evaluatedAt'] ?? ''),
            flags: $flags,
        );
    }

    /**
     * Get a flag by key
     */
    public function getFlag(string $flagKey): ?EvaluatedFlag
    {
        foreach ($this->flags as $flag) {
            if ($flag->flagKey === $flagKey) {
                return $flag;
            }
        }
        return null;
    }
}



