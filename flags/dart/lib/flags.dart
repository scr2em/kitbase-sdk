/// Kitbase Feature Flags SDK for Dart/Flutter
///
/// Evaluate feature flags in your application.
///
/// ```dart
/// import 'package:kitbase/flags.dart';
///
/// final flags = KitbaseFlags(token: '<YOUR_API_KEY>');
///
/// // Simple boolean check
/// final isEnabled = await flags.getBooleanValue(
///   'dark-mode',
///   false,
///   context: EvaluationContext(
///     targetingKey: 'user-123',
///     attributes: {'plan': 'premium'},
///   ),
/// );
///
/// // Get all flags as a snapshot
/// final snapshot = await flags.getSnapshot();
/// for (final flag in snapshot.flags) {
///   print('${flag.flagKey}: ${flag.value}');
/// }
/// ```
library kitbase.flags;

// export 'src/flags/client.dart';
// export 'src/flags/types.dart';
// export 'src/flags/exceptions.dart';
