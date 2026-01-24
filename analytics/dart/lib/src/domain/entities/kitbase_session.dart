/// Session data for analytics tracking
class KitbaseSession {
  final String id;
  final int startedAt;
  final int lastActivityAt;
  final int screenViewCount;
  final String? entryPath;
  final String? entryReferrer;

  KitbaseSession({
    required this.id,
    required this.startedAt,
    required this.lastActivityAt,
    this.screenViewCount = 0,
    this.entryPath,
    this.entryReferrer,
  });

  KitbaseSession copyWith({
    String? id,
    int? startedAt,
    int? lastActivityAt,
    int? screenViewCount,
    String? entryPath,
    String? entryReferrer,
  }) {
    return KitbaseSession(
      id: id ?? this.id,
      startedAt: startedAt ?? this.startedAt,
      lastActivityAt: lastActivityAt ?? this.lastActivityAt,
      screenViewCount: screenViewCount ?? this.screenViewCount,
      entryPath: entryPath ?? this.entryPath,
      entryReferrer: entryReferrer ?? this.entryReferrer,
    );
  }
}
