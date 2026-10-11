/// Centralized API configuration for Laasya Cultural Academy Mobile Client.
///
/// On real Android and iOS mobile devices (such as downloaded APKs),
/// `localhost:3000` refers to the mobile handset itself, which leads to
/// "Socket connection refused: localhost:3000" network exceptions.
///
/// Using the live production Vercel server `https://laasya-academy.vercel.app`
/// ensures reliable communication for all mobile APK downloads.
class ApiConstants {
  /// Live Production Web & Serverless API endpoint
  static const String productionBaseUrl = 'https://laasya-academy.vercel.app';

  /// Local development fallback (for desktop/web browser only if needed)
  static const String localBaseUrl = 'http://localhost:3000';

  /// Primary Base URL used across all mobile HTTP calls and image loaders.
  /// Defaults to production so APKs installed on disciples' and gurus'
  /// mobile devices always succeed without socket connection errors.
  static String get baseUrl {
    return productionBaseUrl;
  }
}
