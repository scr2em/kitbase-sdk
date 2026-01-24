import 'package:sembast/sembast.dart';
import 'db_factory_stub.dart'
    if (dart.library.io) 'db_factory_io.dart'
    if (dart.library.html) 'db_factory_web.dart';

Future<Database> openLocalDatabase(String name) => openDatabase(name);
