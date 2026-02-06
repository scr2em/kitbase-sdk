/// Storage interface for persistence
abstract class KitbaseStorage {
  String? getItem(String key);
  Future<void> setItem(String key, String value);
  Future<void> removeItem(String key);
}
