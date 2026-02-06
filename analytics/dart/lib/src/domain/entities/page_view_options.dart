/// Options for tracking a pageview
class PageViewOptions {
  /// The page path (e.g., '/home', '/products/123')
  final String? path;

  /// The page title
  final String? title;

  /// The referrer URL
  final String? referrer;

  /// Additional metadata tags
  final Map<String, dynamic>? tags;

  const PageViewOptions({
    this.path,
    this.title,
    this.referrer,
    this.tags,
  });
}
