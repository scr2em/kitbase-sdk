import 'package:sembast_web/sembast_web.dart';

Future<Database> openDatabase(String name) async {
  return databaseFactoryWeb.openDatabase(name);
}
