import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';

/// Centralized API configuration for Laasya Cultural Academy Mobile Client.
/// Supports both local development (Windows Desktop & Web -> localhost:3000)
/// and live production deployment (mobile handset APKs -> Vercel backend).
class ApiConstants {
  /// Live Production Web & Serverless API endpoint
  static const String productionBaseUrl = 'https://laasya-academy.vercel.app';

  /// Local development endpoint (when running Next.js web locally on port 3000)
  static const String localBaseUrl = 'http://localhost:3000';

  /// Android emulator loopback endpoint
  static const String androidEmulatorBaseUrl = 'http://10.0.2.2:3000';

  /// Primary Base URL used across all mobile HTTP calls and image loaders.
  static String get baseUrl {
    if (kIsWeb) {
      final host = Uri.base.host;
      if (host.isNotEmpty && host != 'localhost' && host != '127.0.0.1') {
        if (host.contains('vercel.app')) {
          return 'https://$host';
        }
        return 'http://$host:3000';
      }
      return localBaseUrl;
    }
    try {
      if (Platform.isWindows) {
        return localBaseUrl;
      }
    } catch (_) {}

    return productionBaseUrl;
  }
}
