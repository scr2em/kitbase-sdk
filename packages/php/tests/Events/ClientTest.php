<?php

declare(strict_types=1);

namespace Kitbase\Tests\Events;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Psr7\Request;
use Kitbase\Events\ApiException;
use Kitbase\Events\AuthenticationException;
use Kitbase\Events\Kitbase;
use Kitbase\Events\KitbaseConfig;
use Kitbase\Events\TimeoutException;
use Kitbase\Events\TrackOptions;
use Kitbase\Events\TrackResponse;
use Kitbase\Events\ValidationException;
use PHPUnit\Framework\TestCase;

class ClientTest extends TestCase
{
    private function createClient(MockHandler $mock): Kitbase
    {
        $handlerStack = HandlerStack::create($mock);
        $httpClient = new HttpClient(['handler' => $handlerStack]);

        return new Kitbase(
            new KitbaseConfig(token: 'test-token'),
            $httpClient
        );
    }

    public function testConstructorThrowsOnMissingToken(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('API token is required');

        new Kitbase(new KitbaseConfig(token: ''));
    }

    public function testTrackThrowsOnMissingChannel(): void
    {
        $mock = new MockHandler([]);
        $kitbase = $this->createClient($mock);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Channel is required');

        $kitbase->track(new TrackOptions(
            channel: '',
            event: 'Test Event',
        ));
    }

    public function testTrackThrowsOnMissingEvent(): void
    {
        $mock = new MockHandler([]);
        $kitbase = $this->createClient($mock);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Event is required');

        $kitbase->track(new TrackOptions(
            channel: 'test-channel',
            event: '',
        ));
    }

    public function testTrackSuccess(): void
    {
        $responseBody = [
            'id' => 'evt_123',
            'event' => 'Test Event',
            'timestamp' => '2024-01-01T00:00:00Z',
        ];

        $mock = new MockHandler([
            new Response(200, [], json_encode($responseBody)),
        ]);

        $kitbase = $this->createClient($mock);

        $response = $kitbase->track(new TrackOptions(
            channel: 'test-channel',
            event: 'Test Event',
            userId: 'user-123',
            icon: '🎉',
            notify: true,
            description: 'Test description',
            tags: ['key' => 'value'],
        ));

        $this->assertInstanceOf(TrackResponse::class, $response);
        $this->assertEquals('evt_123', $response->id);
        $this->assertEquals('Test Event', $response->event);
        $this->assertEquals('2024-01-01T00:00:00Z', $response->timestamp);
    }

    public function testTrackThrowsAuthenticationException(): void
    {
        $mock = new MockHandler([
            new Response(401, [], json_encode(['message' => 'Invalid API key'])),
        ]);

        $kitbase = $this->createClient($mock);

        $this->expectException(AuthenticationException::class);

        $kitbase->track(new TrackOptions(
            channel: 'test-channel',
            event: 'Test Event',
        ));
    }

    public function testTrackThrowsApiException(): void
    {
        $mock = new MockHandler([
            new Response(500, [], json_encode(['message' => 'Internal server error'])),
        ]);

        $kitbase = $this->createClient($mock);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Internal server error');

        $kitbase->track(new TrackOptions(
            channel: 'test-channel',
            event: 'Test Event',
        ));
    }

    public function testTrackThrowsTimeoutException(): void
    {
        $mock = new MockHandler([
            new ConnectException(
                'Connection timed out',
                new Request('POST', '/v1/logs')
            ),
        ]);

        $kitbase = $this->createClient($mock);

        $this->expectException(TimeoutException::class);

        $kitbase->track(new TrackOptions(
            channel: 'test-channel',
            event: 'Test Event',
        ));
    }

    public function testTrackOptionsToPayload(): void
    {
        $options = new TrackOptions(
            channel: 'payments',
            event: 'New Subscription',
            userId: 'user-123',
            icon: '💰',
            notify: true,
            description: 'Test',
            tags: ['plan' => 'premium'],
        );

        $payload = $options->toPayload();

        $this->assertEquals('payments', $payload['channel']);
        $this->assertEquals('New Subscription', $payload['event']);
        $this->assertEquals('user-123', $payload['user_id']);
        $this->assertEquals('💰', $payload['icon']);
        $this->assertTrue($payload['notify']);
        $this->assertEquals('Test', $payload['description']);
        $this->assertEquals(['plan' => 'premium'], $payload['tags']);
    }

    public function testTrackOptionsToPayloadOmitsNullValues(): void
    {
        $options = new TrackOptions(
            channel: 'payments',
            event: 'New Subscription',
        );

        $payload = $options->toPayload();

        $this->assertArrayHasKey('channel', $payload);
        $this->assertArrayHasKey('event', $payload);
        $this->assertArrayNotHasKey('user_id', $payload);
        $this->assertArrayNotHasKey('icon', $payload);
        $this->assertArrayNotHasKey('notify', $payload);
        $this->assertArrayNotHasKey('description', $payload);
        $this->assertArrayNotHasKey('tags', $payload);
    }
}





