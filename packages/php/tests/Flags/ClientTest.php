<?php

declare(strict_types=1);

namespace Kitbase\Tests\Flags;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Psr7\Request;
use Kitbase\Flags\ApiException;
use Kitbase\Flags\AuthenticationException;
use Kitbase\Flags\EvaluatedFlag;
use Kitbase\Flags\EvaluationContext;
use Kitbase\Flags\Flags;
use Kitbase\Flags\FlagsConfig;
use Kitbase\Flags\FlagSnapshot;
use Kitbase\Flags\FlagValueType;
use Kitbase\Flags\ResolutionDetails;
use Kitbase\Flags\ResolutionReason;
use Kitbase\Flags\TimeoutException;
use Kitbase\Flags\TypeMismatchException;
use Kitbase\Flags\ValidationException;
use PHPUnit\Framework\TestCase;

class ClientTest extends TestCase
{
    private function createClient(MockHandler $mock): Flags
    {
        $handlerStack = HandlerStack::create($mock);
        $httpClient = new HttpClient(['handler' => $handlerStack]);

        return new Flags(
            new FlagsConfig(token: 'test-token'),
            $httpClient
        );
    }

    public function testConstructorThrowsOnMissingToken(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('API token is required');

        new Flags(new FlagsConfig(token: ''));
    }

    public function testGetSnapshotSuccess(): void
    {
        $responseBody = [
            'projectId' => 'proj-123',
            'environmentId' => 'env-456',
            'evaluatedAt' => '2024-01-15T10:30:00Z',
            'flags' => [
                [
                    'flagKey' => 'dark-mode',
                    'enabled' => true,
                    'valueType' => 'boolean',
                    'value' => true,
                    'reason' => 'STATIC',
                ],
            ],
        ];

        $mock = new MockHandler([
            new Response(200, [], json_encode($responseBody)),
        ]);

        $flags = $this->createClient($mock);
        $snapshot = $flags->getSnapshot();

        $this->assertInstanceOf(FlagSnapshot::class, $snapshot);
        $this->assertEquals('proj-123', $snapshot->projectId);
        $this->assertEquals('env-456', $snapshot->environmentId);
        $this->assertCount(1, $snapshot->flags);
        $this->assertEquals('dark-mode', $snapshot->flags[0]->flagKey);
    }

    public function testGetSnapshotWithContext(): void
    {
        $responseBody = [
            'projectId' => 'proj-123',
            'environmentId' => 'env-456',
            'evaluatedAt' => '2024-01-15T10:30:00Z',
            'flags' => [],
        ];

        $mock = new MockHandler([
            new Response(200, [], json_encode($responseBody)),
        ]);

        $flags = $this->createClient($mock);
        $snapshot = $flags->getSnapshot(new EvaluationContext(
            targetingKey: 'user-123',
            attributes: ['plan' => 'premium'],
        ));

        $this->assertInstanceOf(FlagSnapshot::class, $snapshot);
    }

    public function testEvaluateFlagThrowsOnMissingFlagKey(): void
    {
        $mock = new MockHandler([]);
        $flags = $this->createClient($mock);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Flag key is required');

        $flags->evaluateFlag('');
    }

    public function testEvaluateFlagSuccess(): void
    {
        $responseBody = [
            'flagKey' => 'dark-mode',
            'enabled' => true,
            'valueType' => 'boolean',
            'value' => true,
            'variant' => 'default-enabled',
            'reason' => 'STATIC',
        ];

        $mock = new MockHandler([
            new Response(200, [], json_encode($responseBody)),
        ]);

        $flags = $this->createClient($mock);
        $result = $flags->evaluateFlag('dark-mode');

        $this->assertInstanceOf(EvaluatedFlag::class, $result);
        $this->assertEquals('dark-mode', $result->flagKey);
        $this->assertTrue($result->enabled);
        $this->assertEquals(FlagValueType::BOOLEAN, $result->valueType);
        $this->assertTrue($result->value);
    }

    public function testGetBooleanValueReturnsTrue(): void
    {
        $responseBody = [
            'flagKey' => 'dark-mode',
            'enabled' => true,
            'valueType' => 'boolean',
            'value' => true,
            'reason' => 'STATIC',
        ];

        $mock = new MockHandler([
            new Response(200, [], json_encode($responseBody)),
        ]);

        $flags = $this->createClient($mock);
        $result = $flags->getBooleanValue('dark-mode', false);

        $this->assertTrue($result);
    }

    public function testGetBooleanValueReturnsDefaultWhenDisabled(): void
    {
        $responseBody = [
            'flagKey' => 'dark-mode',
            'enabled' => false,
            'valueType' => 'boolean',
            'value' => null,
            'reason' => 'DISABLED',
        ];

        $mock = new MockHandler([
            new Response(200, [], json_encode($responseBody)),
        ]);

        $flags = $this->createClient($mock);
        $result = $flags->getBooleanValue('dark-mode', true);

        $this->assertTrue($result);
    }

    public function testGetBooleanDetailsReturnsResolutionDetails(): void
    {
        $responseBody = [
            'flagKey' => 'feature-x',
            'enabled' => true,
            'valueType' => 'boolean',
            'value' => true,
            'variant' => 'segment-abc123',
            'reason' => 'TARGETING_MATCH',
            'flagMetadata' => ['name' => 'Feature X'],
        ];

        $mock = new MockHandler([
            new Response(200, [], json_encode($responseBody)),
        ]);

        $flags = $this->createClient($mock);
        $result = $flags->getBooleanDetails('feature-x', false, new EvaluationContext(
            targetingKey: 'user-123',
        ));

        $this->assertInstanceOf(ResolutionDetails::class, $result);
        $this->assertTrue($result->value);
        $this->assertEquals('segment-abc123', $result->variant);
        $this->assertEquals(ResolutionReason::TARGETING_MATCH, $result->reason);
        $this->assertEquals(['name' => 'Feature X'], $result->flagMetadata);
    }

    public function testGetBooleanValueThrowsTypeMismatch(): void
    {
        $responseBody = [
            'flagKey' => 'api-url',
            'enabled' => true,
            'valueType' => 'string',
            'value' => 'https://api.example.com',
            'reason' => 'STATIC',
        ];

        $mock = new MockHandler([
            new Response(200, [], json_encode($responseBody)),
        ]);

        $flags = $this->createClient($mock);

        $this->expectException(TypeMismatchException::class);
        $this->expectExceptionMessage("Type mismatch for flag 'api-url': expected boolean, got string");

        $flags->getBooleanValue('api-url', false);
    }

    public function testGetStringValue(): void
    {
        $responseBody = [
            'flagKey' => 'api-url',
            'enabled' => true,
            'valueType' => 'string',
            'value' => 'https://api.example.com',
            'reason' => 'STATIC',
        ];

        $mock = new MockHandler([
            new Response(200, [], json_encode($responseBody)),
        ]);

        $flags = $this->createClient($mock);
        $result = $flags->getStringValue('api-url', 'default');

        $this->assertEquals('https://api.example.com', $result);
    }

    public function testGetNumberValue(): void
    {
        $responseBody = [
            'flagKey' => 'max-items',
            'enabled' => true,
            'valueType' => 'number',
            'value' => 100,
            'reason' => 'STATIC',
        ];

        $mock = new MockHandler([
            new Response(200, [], json_encode($responseBody)),
        ]);

        $flags = $this->createClient($mock);
        $result = $flags->getNumberValue('max-items', 50);

        $this->assertEquals(100, $result);
    }

    public function testGetJsonValue(): void
    {
        $jsonValue = ['theme' => 'dark', 'fontSize' => 14];
        $responseBody = [
            'flagKey' => 'ui-config',
            'enabled' => true,
            'valueType' => 'json',
            'value' => $jsonValue,
            'reason' => 'STATIC',
        ];

        $mock = new MockHandler([
            new Response(200, [], json_encode($responseBody)),
        ]);

        $flags = $this->createClient($mock);
        $result = $flags->getJsonValue('ui-config', []);

        $this->assertEquals($jsonValue, $result);
    }

    public function testThrowsAuthenticationException(): void
    {
        $mock = new MockHandler([
            new Response(401, [], json_encode(['message' => 'Invalid API key'])),
        ]);

        $flags = $this->createClient($mock);

        $this->expectException(AuthenticationException::class);

        $flags->getSnapshot();
    }

    public function testThrowsApiException(): void
    {
        $mock = new MockHandler([
            new Response(500, [], json_encode(['message' => 'Internal server error'])),
        ]);

        $flags = $this->createClient($mock);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Internal server error');

        $flags->getSnapshot();
    }

    public function testThrowsTimeoutException(): void
    {
        $mock = new MockHandler([
            new ConnectException(
                'Connection timed out',
                new Request('POST', '/v1/feature-flags/snapshot')
            ),
        ]);

        $flags = $this->createClient($mock);

        $this->expectException(TimeoutException::class);

        $flags->getSnapshot();
    }

    public function testEvaluationContextToPayload(): void
    {
        $context = new EvaluationContext(
            targetingKey: 'user-123',
            attributes: ['plan' => 'premium', 'country' => 'US'],
        );

        $payload = $context->toPayload();

        $this->assertEquals('user-123', $payload['identityId']);
        $this->assertEquals(['plan' => 'premium', 'country' => 'US'], $payload['context']);
    }

    public function testEvaluationContextToPayloadOmitsNullValues(): void
    {
        $context = new EvaluationContext();

        $payload = $context->toPayload();

        $this->assertArrayNotHasKey('identityId', $payload);
        $this->assertArrayNotHasKey('context', $payload);
    }

    public function testFlagSnapshotGetFlag(): void
    {
        $snapshot = new FlagSnapshot(
            projectId: 'proj-123',
            environmentId: 'env-456',
            evaluatedAt: '2024-01-15T10:30:00Z',
            flags: [
                new EvaluatedFlag(
                    flagKey: 'flag-1',
                    enabled: true,
                    valueType: FlagValueType::BOOLEAN,
                    value: true,
                ),
                new EvaluatedFlag(
                    flagKey: 'flag-2',
                    enabled: false,
                    valueType: FlagValueType::STRING,
                    value: null,
                ),
            ],
        );

        $flag1 = $snapshot->getFlag('flag-1');
        $flag2 = $snapshot->getFlag('flag-2');
        $flag3 = $snapshot->getFlag('non-existent');

        $this->assertNotNull($flag1);
        $this->assertEquals('flag-1', $flag1->flagKey);
        $this->assertNotNull($flag2);
        $this->assertEquals('flag-2', $flag2->flagKey);
        $this->assertNull($flag3);
    }
}
