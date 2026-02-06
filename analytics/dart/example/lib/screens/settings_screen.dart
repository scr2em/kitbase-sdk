import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:kitbase_analytics/kitbase_analytics.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _isOptedOut = false;
  bool _isDebug = false;

  @override
  void initState() {
    super.initState();
    _refreshState();
    KitbaseAnalytics.trackPageView(PageViewOptions(title: 'Settings'));
  }

  void _refreshState() {
    setState(() {
      _isOptedOut = KitbaseAnalytics.isOptedOut();
      _isDebug = KitbaseAnalytics.isDebugMode();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          SwitchListTile(
            title: const Text('Opt-out of Tracking'),
            subtitle: const Text('Disable all analytics collection'),
            value: _isOptedOut,
            onChanged: (val) async {
              if (val) {
                await KitbaseAnalytics.optOut();
              } else {
                await KitbaseAnalytics.optIn();
              }
              _refreshState();
            },
          ),
          SwitchListTile(
            title: const Text('Debug Mode'),
            subtitle: const Text('Enable verbose logging'),
            value: _isDebug,
            onChanged: (val) {
              KitbaseAnalytics.setDebugMode(val);
              _refreshState();
            },
          ),
          const Divider(),
          ListTile(
            title: const Text('Unidentify (Logout)'),
            subtitle: const Text('Clear current user identity'),
            leading: const Icon(Icons.logout, color: Colors.red),
            onTap: () {
              KitbaseAnalytics.unidentify();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('User Identity Cleared')),
              );
            },
          ),
          ListTile(
            title: const Text('View Stored Data'),
            subtitle: const Text('Inspect and clear offline logs'),
            leading: const Icon(Icons.storage, color: Colors.blue),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              context.push('/debug-data');
            },
          ),
          ListTile(
            title: const Text('Reset SDK'),
            subtitle: const Text('Full reset (for testing)'),
            leading: const Icon(Icons.refresh),
            onTap: () async {
              await KitbaseAnalytics.reset();
              // Re-init for app to keep working
              KitbaseAnalytics.init(
                const KitbaseConfig(token: 'EXAMPLE_TOKEN', debug: true),
              );
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('SDK Reset & Re-initialized')),
              );
            },
          ),
        ],
      ),
    );
  }
}
