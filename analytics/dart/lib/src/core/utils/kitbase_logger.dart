import 'dart:developer';

/// Kitbase SDK internal logger.
///
/// Only logs when debug mode is enabled.
abstract class KitbaseLogger {
  /// Log an info message.
  static void info(String message, [dynamic data]) {
    _log('INFO', message, data);
  }

  /// Log a warning message.
  static void warning(String message, [dynamic data]) {
    _log('WARN', message, data);
  }

  /// Log an error message.
  static void error(String message, [dynamic data]) {
    _log('ERROR', message, data);
  }

  static void _log(String level, String message, dynamic data) {
    final timestamp = DateTime.now().toIso8601String();
    if (data != null) {
      log('[$timestamp] [Kitbase/$level] $message $data');
    } else {
      log('[$timestamp] [Kitbase/$level] $message');
    }
  }
}
