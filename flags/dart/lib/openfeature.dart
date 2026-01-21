/// Kitbase Feature Flags OpenFeature Provider for Dart/Flutter
///
/// Provides OpenFeature integration for the Kitbase feature flags service.
///
/// This requires the `openfeature_dart_server_sdk` package.
///
/// ```dart
/// import 'package:openfeature_dart_server_sdk/open_feature_api.dart';
/// import 'package:openfeature_dart_server_sdk/client.dart';
/// import 'package:openfeature_dart_server_sdk/hooks.dart';
/// import 'package:openfeature_dart_server_sdk/evaluation_context.dart';
/// import 'package:kitbase/flags/openfeature.dart';
///
/// void main() async {
///   // Register the Kitbase provider
///   final api = OpenFeatureAPI();
///   api.setProvider(KitbaseProvider(
///     options: KitbaseProviderOptions(token: '<YOUR_API_KEY>'),
///   ));
///
///   // Create a client
///   final client = FeatureClient(
///     metadata: ClientMetadata(name: 'my-app'),
///     hookManager: HookManager(),
///     defaultContext: EvaluationContext(attributes: {}),
///   );
///
///   // Evaluate flags
///   final isEnabled = await client.getBooleanFlag(
///     'dark-mode',
///     defaultValue: false,
///     context: EvaluationContext(attributes: {
///       'targetingKey': 'user-123',
///       'plan': 'premium',
///     }),
///   );
///
///   print('Dark mode enabled: $isEnabled');
/// }
/// ```
library kitbase.flags.openfeature;

// export '../src/flags/openfeature/provider.dart';
