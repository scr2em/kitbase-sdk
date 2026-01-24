import 'package:kitbase_analytics/src/data/datasources/local/storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Implementation of [KitbaseStorage] using [SharedPreferences]
class SharedPrefsStorage implements KitbaseStorage {
  final SharedPreferences _prefs;

  SharedPrefsStorage(this._prefs);

  @override
  String? getItem(String key) {
    return _prefs.getString(key);
  }

  @override
  Future<void> setItem(String key, String value) async {
    await _prefs.setString(key, value);
  }

  @override
  Future<void> removeItem(String key) async {
    await _prefs.remove(key);
  }
}
