/// Global constants for the Kitbase SDK.
abstract class KitbaseConstants {
  /// Base URL for the Kitbase API.
  static const String baseUrl = 'https://ingest.kitbase.dev';

  /// Default request timeout.
  static const Duration timeout = Duration(seconds: 30);
}
