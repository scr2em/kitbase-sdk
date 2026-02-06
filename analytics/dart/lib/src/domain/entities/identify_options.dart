/// Options for identifying a user
class IdentifyOptions {
  /// The unique user identifier
  final String userId;

  /// User traits/properties
  final Map<String, dynamic>? traits;

  const IdentifyOptions({
    required this.userId,
    this.traits,
  });
}
