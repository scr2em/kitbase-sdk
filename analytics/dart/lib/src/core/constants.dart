/// Global constants for the Kitbase SDK.
abstract class KitbaseConstants {
  /// Base URL for the Kitbase API.
  static const String baseUrl = 'https://api.kitbase.dev';

  /// Default request timeout.
  static const Duration timeout = Duration(seconds: 30);

  /// Default storage key for anonymous ID.
  static const String defaultAnonymousIdKey = '_ka_anonymous_id';

  /// Default storage key for opt-out status.
  static const String defaultOptOutKey = '_ka_opt_out';

  /// Default storage key for session data.
  static const String defaultSessionKey = '_ka_session';

  /// Default storage key for user ID.
  static const String defaultUserIdKey = '_ka_user_id';

  /// Standard channel for analytics events.
  static const String analyticsChannel = '__analytics';
}
