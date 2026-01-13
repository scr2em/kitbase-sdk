/**
 * Configuration options for the Changelogs client
 */
export interface ChangelogsConfig {
  /**
   * Your Kitbase API key
   */
  token: string;
}

/**
 * Response from the changelog API
 */
export interface ChangelogResponse {
  /**
   * Unique identifier for the changelog
   */
  id: string;

  /**
   * Version string for this changelog (e.g., "1.0.0", "2.3.1")
   */
  version: string;

  /**
   * Changelog content in Markdown format
   */
  markdown: string;

  /**
   * Whether the changelog is published
   */
  isPublished: boolean;

  /**
   * Project ID
   */
  projectId: string;

  /**
   * When the changelog was created
   */
  createdAt: string;

  /**
   * When the changelog was last updated
   */
  updatedAt: string;
}
