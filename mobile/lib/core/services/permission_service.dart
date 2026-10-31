import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/colors.dart';

class PermissionService {
  static const String _prefStudentNotifPrompted = 'laasya_student_notif_prompted_v4';
  static const String _prefTrainerNotifPrompted = 'laasya_trainer_notif_prompted_v4';
  static bool _dialogShowing = false;

  /// Requests notification permission only when needed, with a clear explanation.
  /// Respects the user's choice: if denied or dismissed, does not repeatedly prompt.
  /// Does NOT force background execution or battery-optimization exemptions.
  static Future<void> promptRequiredPermissions(BuildContext context, {required String role}) async {
    if (kIsWeb) return;
    try {
      final isStudent = role.toLowerCase() == 'student';
      final prefKey = isStudent ? _prefStudentNotifPrompted : _prefTrainerNotifPrompted;

      final prefs = await SharedPreferences.getInstance();
      final hasPrompted = prefs.getBool(prefKey) ?? false;
      if (hasPrompted) {
        return; // Respect the user's previous choice; do not repeatedly ask!
      }

      final notifGranted = await Permission.notification.isGranted;
      if (notifGranted) {
        await prefs.setBool(prefKey, true);
        return;
      }

      if (!context.mounted || _dialogShowing) return;
      _dialogShowing = true;

      final title = isStudent ? 'Class Alerts & Attendance Notifications' : 'Academy Notices & Circulars';
      final description = isStudent
          ? 'Enable notifications to receive class completion alerts and daily attendance confirmations from your Guru.'
          : 'Enable notifications to receive official circulars, student inquiries, and academy announcements from the Director.';

      await showDialog<void>(
        context: context,
        barrierDismissible: true,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          titlePadding: const EdgeInsets.fromLTRB(22, 22, 22, 10),
          contentPadding: const EdgeInsets.fromLTRB(22, 10, 22, 16),
          actionsPadding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
          title: Row(
            children: [
              const Icon(Icons.notifications_active_rounded, color: LaasyaColors.primary, size: 24),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: LaasyaColors.textDark),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                description,
                style: const TextStyle(fontSize: 13, color: Colors.black87, height: 1.45),
              ),
              const SizedBox(height: 14),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF2F8),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.notifications_outlined, size: 20, color: LaasyaColors.primary),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      isStudent
                          ? 'Class conclusion and attendance notifications will be delivered directly.'
                          : 'Administrative broadcasts and circulars will be delivered directly.',
                      style: const TextStyle(fontSize: 11.5, color: Colors.black54, height: 1.35),
                    ),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () async {
                Navigator.pop(ctx);
                final p = await SharedPreferences.getInstance();
                await p.setBool(prefKey, true); // Respect choice: don't ask again!
              },
              child: const Text('Not Now', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                final p = await SharedPreferences.getInstance();
                await p.setBool(prefKey, true);
                await Permission.notification.request();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: LaasyaColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Allow Notifications', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
    } catch (e) {
      debugPrint('Permission prompt error: $e');
    } finally {
      _dialogShowing = false;
    }
  }

  /// Requests all necessary permissions once after install / first launch.
  static Future<void> requestAppPermissions(BuildContext context, {String role = 'student'}) async {
    await promptRequiredPermissions(context, role: role);
  }

  /// Shows permissions dialog on demand from Settings screen
  static void showPermissionsDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Row(
          children: [
            Icon(Icons.security_rounded, color: LaasyaColors.primary, size: 24),
            SizedBox(width: 10),
            Text('App Permissions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Manage device permissions for Laasya Cultural Academy:',
              style: TextStyle(fontSize: 12.5, color: Colors.black87),
            ),
            const SizedBox(height: 14),
            _permRow(
              Icons.notifications_active_rounded,
              'Notifications',
              'To receive class conclusion alerts and circulars.',
              const Color(0xFFC2410C),
              const Color(0xFFFFEDD5),
            ),
            const SizedBox(height: 10),
            _permRow(
              Icons.camera_alt_rounded,
              'Camera & Photos',
              'To capture and upload profile pictures.',
              const Color(0xFF1E429F),
              const Color(0xFFE1EFFE),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await openAppSettings();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: LaasyaColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Manage Permissions', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  static Widget _permRow(IconData icon, String title, String desc, Color iconColor, Color bgColor) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: iconColor),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5, color: LaasyaColors.textDark)),
              const SizedBox(height: 2),
              Text(desc, style: const TextStyle(fontSize: 11, color: Colors.black54, height: 1.3)),
            ],
          ),
        ),
      ],
    );
  }
}
