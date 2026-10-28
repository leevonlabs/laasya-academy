import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// Unified PDF opener and downloader utility for Laasya Cultural Academy ERP Mobile.
/// Connects to the ERP's shared vector PDF generation API endpoints,
/// ensuring 100% visual consistency between web admin and mobile.
class PdfLauncher {
  static Future<bool> openPdf(
    BuildContext context,
    String url, {
    String? title,
  }) async {
    try {
      final uri = Uri.parse(url);
      final launched = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        // Fallback to platform default
        await launchUrl(uri, mode: LaunchMode.platformDefault);
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.picture_as_pdf_rounded, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title != null ? '$title opened / downloading!' : 'Official PDF opened / downloading!',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                ),
              ],
            ),
            backgroundColor: const Color(0xFF03543F),
            duration: const Duration(seconds: 3),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return true;
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Unable to open PDF: $e'),
            backgroundColor: Colors.red.shade800,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return false;
    }
  }
}
