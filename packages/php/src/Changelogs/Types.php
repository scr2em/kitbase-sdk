<?php

declare(strict_types=1);

namespace Kitbase\Changelogs;

/**
 * Configuration options for the Changelogs client
 */
class ChangelogsConfig
{
    /**
     * @param string $token Your Kitbase API key
     */
    public function __construct(
        public readonly string $token,
    ) {}
}

/**
 * Response from the changelog API
 */
class ChangelogResponse
{
    /**
     * @param string $id Unique identifier for the changelog
     * @param string $version Version string for this changelog (e.g., "1.0.0", "2.3.1")
     * @param string $markdown Changelog content in Markdown format
     * @param bool $isPublished Whether the changelog is published
     * @param string $projectId Project ID
     * @param string $createdAt When the changelog was created
     * @param string $updatedAt When the changelog was last updated
     */
    public function __construct(
        public readonly string $id,
        public readonly string $version,
        public readonly string $markdown,
        public readonly bool $isPublished,
        public readonly string $projectId,
        public readonly string $createdAt,
        public readonly string $updatedAt,
    ) {}

    /**
     * Create from API response array
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: (string) ($data['id'] ?? ''),
            version: (string) ($data['version'] ?? ''),
            markdown: (string) ($data['markdown'] ?? ''),
            isPublished: (bool) ($data['isPublished'] ?? false),
            projectId: (string) ($data['projectId'] ?? ''),
            createdAt: (string) ($data['createdAt'] ?? ''),
            updatedAt: (string) ($data['updatedAt'] ?? ''),
        );
    }
}







