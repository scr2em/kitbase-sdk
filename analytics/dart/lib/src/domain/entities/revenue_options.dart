/// Options for tracking revenue
class RevenueOptions {
  /// Revenue amount in cents (e.g., 1999 for $19.99)
  final int amount;

  /// Currency code (e.g., 'USD', 'EUR')
  final String currency;

  /// Optional user identifier
  final String? userId;

  /// Additional metadata tags
  final Map<String, dynamic>? tags;

  const RevenueOptions({
    required this.amount,
    this.currency = 'USD',
    this.userId,
    this.tags,
  });
}
