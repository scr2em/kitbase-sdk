import 'package:sembast/sembast_io.dart';
import 'package:path_provider/path_provider.dart';

Future<Database> openDatabase(String name) async {
  final dir = await getApplicationDocumentsDirectory();
  await dir.create(recursive: true);
  final dbPath = '${dir.path}/$name';
  return databaseFactoryIo.openDatabase(dbPath);
}
