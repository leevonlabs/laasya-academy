import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/colors.dart';

class EventFolderDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> folder;

  const EventFolderDetailsScreen({
    super.key,
    required this.folder,
  });

  String _formatDate(dynamic dateVal) {
    if (dateVal == null) return '--';
    final s = dateVal.toString();
    if (s.isEmpty) return '--';
    try {
      DateTime dt;
      if (s.contains('T')) {
        dt = DateTime.parse(s);
      } else if (s.contains('-') && s.length >= 10) {
        final parts = s.split('-');
        if (parts.length >= 3) {
          dt = DateTime(int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2].substring(0, 2)));
        } else {
          dt = DateTime.parse(s);
        }
      } else {
        return s;
      }
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      final dayStr = dt.day.toString().padLeft(2, '0');
      final monthStr = months[dt.month - 1];
      return '$dayStr $monthStr ${dt.year}';
    } catch (_) {
      return s;
    }
  }

  Future<void> _openDriveUrl(BuildContext context, String url) async {
    final cleanUrl = url.trim();
    if (cleanUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No Google Drive link available')),
      );
      return;
    }

    try {
      final uri = Uri.parse(cleanUrl);
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched) {
        // Fallback launch
        await launchUrl(uri);
      }
    } catch (e) {
      // In web or restricted environments, copy to clipboard and open in new tab
      Clipboard.setData(ClipboardData(text: cleanUrl));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Drive link copied: $cleanUrl'),
            backgroundColor: LaasyaColors.primary,
          ),
        );
      }
    }
  }

  void _copyLink(BuildContext context, String url, String title) {
    Clipboard.setData(ClipboardData(text: url.trim()));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Google Drive link copied for "$title"!',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF03543F),
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = (folder['title'] ?? 'Event Shoot Folder').toString();
    final course = (folder['target_course_title'] ?? 'All Academy Courses').toString();
    final batch = (folder['target_batch_name'] ?? 'All Batches').toString();
    final eventDateRaw = folder['event_date'];
    final uploadDateRaw = folder['created_at'] ?? folder['event_date'];
    final driveUrl = (folder['drive_url'] ?? '').toString();
    final desc = (folder['description'] ?? 'Official event shoot video media and high-resolution photography.').toString();
    final createdBy = (folder['created_by'] ?? 'Academy Director').toString();

    final eventDateFormatted = _formatDate(eventDateRaw);
    final uploadDateFormatted = _formatDate(uploadDateRaw);

    return Scaffold(
      backgroundColor: const Color(0xFFFBF8FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFF590231),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Event Shoot Details',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // =================================================================
            // 1. TOP HERO CARD
            // =================================================================
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF590231), Color(0xFF8A064D)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.6), width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: LaasyaColors.primaryDark.withOpacity(0.25),
                    blurRadius: 14,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDEF7EC),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.folder_shared_rounded, size: 13, color: Color(0xFF03543F)),
                            SizedBox(width: 5),
                            Text(
                              'EVENT FOLDER',
                              style: TextStyle(color: Color(0xFF03543F), fontSize: 10.5, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.25),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: LaasyaColors.accentGold.withOpacity(0.4)),
                        ),
                        child: Text(
                          'By $createdBy',
                          style: const TextStyle(color: LaasyaColors.accentGold, fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Target: $course • $batch',
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // =================================================================
            // 2. DATES DISPLAY: EVENT DATE & UPLOAD DATE
            // =================================================================
            Row(
              children: [
                // Event Date Card
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFF0D5E4)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.event_available_rounded, size: 16, color: LaasyaColors.primary),
                            const SizedBox(width: 6),
                            Text(
                              'Event Date',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          eventDateFormatted,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: LaasyaColors.textDark,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Performance / Shoot Day',
                          style: TextStyle(fontSize: 10, color: Colors.black45),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Upload Date Card
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFF0D5E4)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.cloud_upload_rounded, size: 16, color: Color(0xFF03543F)),
                            const SizedBox(width: 6),
                            Text(
                              'Upload Date',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          uploadDateFormatted,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF03543F),
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Drive Publishing Date',
                          style: TextStyle(fontSize: 10, color: Colors.black45),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // =================================================================
            // 3. DESCRIPTION / INSTRUCTIONS CARD
            // =================================================================
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFF0D5E4)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.notes_rounded, size: 18, color: LaasyaColors.primary),
                      SizedBox(width: 8),
                      Text(
                        'Shoot Description & Instructions',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    desc.isEmpty ? 'No additional notes provided for this event shoot folder.' : desc,
                    style: const TextStyle(fontSize: 13, color: Colors.black87, height: 1.45),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // =================================================================
            // 4. GOOGLE DRIVE ACCESS & REDIRECT ACTIONS
            // =================================================================
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFF0D5E4), width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.link_rounded, size: 20, color: LaasyaColors.primary),
                      SizedBox(width: 8),
                      Text(
                        'Google Drive Media Folder',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: LaasyaColors.textDark),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Tap below to open directly in Google Drive or copy the link to your clipboard.',
                    style: TextStyle(fontSize: 11.5, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),

                  // Drive URL box
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF9FB),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFF0D5E4)),
                    ),
                    child: Text(
                      driveUrl,
                      style: const TextStyle(
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: Colors.black87,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),

                  const SizedBox(height: 18),

                  // Primary Button: Open in Google Drive (Redirects directly)
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF590231),
                        foregroundColor: Colors.white,
                        elevation: 2,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () => _openDriveUrl(context, driveUrl),
                      icon: const Icon(Icons.open_in_new_rounded, size: 18, color: LaasyaColors.accentGold),
                      label: const Text(
                        'Open in Google Drive',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 0.2),
                      ),
                    ),
                  ),

                  const SizedBox(height: 10),

                  // Secondary Button: Copy Drive Link
                  SizedBox(
                    width: double.infinity,
                    height: 46,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: LaasyaColors.primary,
                        side: const BorderSide(color: Color(0xFFF0D5E4), width: 1.2),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () => _copyLink(context, driveUrl, title),
                      icon: const Icon(Icons.copy_rounded, size: 16),
                      label: const Text(
                        'Copy Drive Link',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
