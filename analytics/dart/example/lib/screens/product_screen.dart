import 'package:flutter/material.dart';
import 'package:kitbase_analytics/kitbase_analytics.dart';

class ProductScreen extends StatefulWidget {
  final String id;
  const ProductScreen({super.key, required this.id});

  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  @override
  void initState() {
    super.initState();
    KitbaseAnalytics.trackPageView(
      PageViewOptions(
        title: 'Product Details',
        tags: {'product_id': widget.id},
      ),
    );

    // Time an event (time spent on page)
    KitbaseAnalytics.startTimeEvent('View Product Duration');
  }

  @override
  void dispose() {
    // End timed event
    KitbaseAnalytics.trackTimeEvent(
      TrackOptions(
        channel: 'products',
        event: 'View Product Duration',
        tags: {'product_id': widget.id},
      ),
    );
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Product ${widget.id}')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.shopping_bag, size: 80, color: Colors.blue.shade300),
            const SizedBox(height: 20),
            Text(
              'Details for Product ${widget.id}',
              style: const TextStyle(fontSize: 18),
            ),
            const SizedBox(height: 40),
            ElevatedButton(
              onPressed: () {
                // Track Conversion
                KitbaseAnalytics.trackRevenue(
                  RevenueOptions(
                    amount: 9999, // cents
                    currency: 'USD',
                    tags: {'product_id': widget.id},
                  ),
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Revenue Tracked: \$99.99')),
                );
              },
              child: const Text('Buy Now (\$99.99)'),
            ),
          ],
        ),
      ),
    );
  }
}
