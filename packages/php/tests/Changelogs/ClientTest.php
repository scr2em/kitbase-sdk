<?php

declare(strict_types=1);

namespace Kitbase\Tests\Changelogs;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Psr7\Request;
use Kitbase\Changelogs\ApiException;
use Kitbase\Changelogs\AuthenticationException;
use Kitbase\Changelogs\Changelogs;
use Kitbase\Changelogs\ChangelogsConfig;
use Kitbase\Changelogs\ChangelogResponse;
use Kitbase\Changelogs\NotFoundException;
use Kitbase\Changelogs\TimeoutException;
use Kitbase\Changelogs\ValidationException;
use PHPUnit\Framework\TestCase;

class ClientTest extends TestCase
{
    private function createClient(MockHandler $mock): Changelogs
    {
        $handlerStack = HandlerStack::create($mock);
        $httpClient = new HttpClient(['handler' => $handlerStack]);

        return new Changelogs(
            new ChangelogsConfig(token: 'test-token'),
            $httpClient
        );
    }

    public function testConstructorThrowsOnMissingToken(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('API token is required');

        new Changelogs(new ChangelogsConfig(token: ''));
    }

    public function testGetThrowsOnMissingVersion(): void
    {
        $mock = new MockHandler([]);
        $changelogs = $this->createClient($mock);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Version is required');

        $changelogs->get('');
    }

    public function testGetSuccess(): void
    {
        $responseBody = [
            'id' => 'cl_123',
            'version' => '1.0.0',
            'markdown' => '## Release 1.0.0\n\n- New feature',
            'isPublished' => true,
            'projectId' => 'proj_456',
            'createdAt' => '2024-01-01T00:00:00Z',
            'updatedAt' => '2024-01-02T00:00:00Z',
        ];

        $mock = new MockHandler([
            new Response(200, [], json_encode($responseBody)),
        ]);

        $changelogs = $this->createClient($mock);

        $changelog = $changelogs->get('1.0.0');

        $this->assertInstanceOf(ChangelogResponse::class, $changelog);
        $this->assertEquals('cl_123', $changelog->id);
        $this->assertEquals('1.0.0', $changelog->version);
        $this->assertEquals('## Release 1.0.0\n\n- New feature', $changelog->markdown);
        $this->assertTrue($changelog->isPublished);
        $this->assertEquals('proj_456', $changelog->projectId);
        $this->assertEquals('2024-01-01T00:00:00Z', $changelog->createdAt);
        $this->assertEquals('2024-01-02T00:00:00Z', $changelog->updatedAt);
    }

    public function testGetThrowsAuthenticationException(): void
    {
        $mock = new MockHandler([
            new Response(401, [], json_encode(['message' => 'Invalid API key'])),
        ]);

        $changelogs = $this->createClient($mock);

        $this->expectException(AuthenticationException::class);

        $changelogs->get('1.0.0');
    }

    public function testGetThrowsNotFoundException(): void
    {
        $mock = new MockHandler([
            new Response(404, [], json_encode(['message' => 'Not found'])),
        ]);

        $changelogs = $this->createClient($mock);

        try {
            $changelogs->get('1.0.0');
            $this->fail('Expected NotFoundException to be thrown');
        } catch (NotFoundException $e) {
            $this->assertEquals('1.0.0', $e->version);
            $this->assertStringContainsString('1.0.0', $e->getMessage());
        }
    }

    public function testGetThrowsApiException(): void
    {
        $mock = new MockHandler([
            new Response(500, [], json_encode(['message' => 'Internal server error'])),
        ]);

        $changelogs = $this->createClient($mock);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Internal server error');

        $changelogs->get('1.0.0');
    }

    public function testGetThrowsTimeoutException(): void
    {
        $mock = new MockHandler([
            new ConnectException(
                'Connection timed out',
                new Request('GET', '/v1/changelogs/1.0.0')
            ),
        ]);

        $changelogs = $this->createClient($mock);

        $this->expectException(TimeoutException::class);

        $changelogs->get('1.0.0');
    }

    public function testChangelogResponseFromArray(): void
    {
        $data = [
            'id' => 'cl_123',
            'version' => '2.0.0',
            'markdown' => '# v2.0.0\n\nBreaking changes',
            'isPublished' => false,
            'projectId' => 'proj_789',
            'createdAt' => '2024-06-01T12:00:00Z',
            'updatedAt' => '2024-06-15T18:30:00Z',
        ];

        $response = ChangelogResponse::fromArray($data);

        $this->assertEquals('cl_123', $response->id);
        $this->assertEquals('2.0.0', $response->version);
        $this->assertEquals('# v2.0.0\n\nBreaking changes', $response->markdown);
        $this->assertFalse($response->isPublished);
        $this->assertEquals('proj_789', $response->projectId);
        $this->assertEquals('2024-06-01T12:00:00Z', $response->createdAt);
        $this->assertEquals('2024-06-15T18:30:00Z', $response->updatedAt);
    }

    public function testChangelogResponseFromArrayWithMissingFields(): void
    {
        $data = [];

        $response = ChangelogResponse::fromArray($data);

        $this->assertEquals('', $response->id);
        $this->assertEquals('', $response->version);
        $this->assertEquals('', $response->markdown);
        $this->assertFalse($response->isPublished);
        $this->assertEquals('', $response->projectId);
        $this->assertEquals('', $response->createdAt);
        $this->assertEquals('', $response->updatedAt);
    }
}






