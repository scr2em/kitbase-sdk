/// Configuration for the KitbaseChangelogs client.
class KitbaseChangelogsConfig {
  /// Your Kitbase API key.
  final String token;

  const KitbaseChangelogsConfig({
    required this.token,
  });
}

/// Response from the changelog API.
class ChangelogResponse {
  /// Unique identifier for the changelog.
  final String id;

  /// Version string for this changelog (e.g., "1.0.0", "2.3.1").
  final String version;

  /// Changelog content in Markdown format.
  final String markdown;

  /// Whether the changelog is published.
  final bool isPublished;

  /// Project ID.
  final String projectId;

  /// When the changelog was created.
  final String createdAt;

  /// When the changelog was last updated.
  final String updatedAt;

  const ChangelogResponse({
    required this.id,
    required this.version,
    required this.markdown,
    required this.isPublished,
    required this.projectId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ChangelogResponse.fromJson(Map<String, dynamic> json) {
    return ChangelogResponse(
      id: json['id'] as String,
      version: json['version'] as String,
      markdown: json['markdown'] as String,
      isPublished: json['isPublished'] as bool,
      projectId: json['projectId'] as String,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }
}





