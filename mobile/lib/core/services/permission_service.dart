import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/colors.dart';
import 'alarm_service.dart';

class PermissionService {
  static const String _prefKey = 'laasya_permissions_prompted_v3';
  static bool _dialogShowing = false;

  /// Requests all necessary permissions once after install / first launch.
  /// Uses SharedPreferences to ensure the user is NOT repeatedly prompted on every app launch.
  static Future<void> requestAppPermissions(BuildContext context) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final hasPrompted = prefs.getBool(_prefKey) ?? false;
      if (hasPrompted) return;

      if (!context.mounted || _dialogShowing) return;
      _dialogShowing = true;

      // Show clean, essential permissions dialog
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          titlePadding: const EdgeInsets.fromLTRB(22, 22, 22, 10),
          contentPadding: const EdgeInsets.fromLTRB(22, 10, 22, 16),
          actionsPadding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
          title: const Row(
            children: [
              Icon(Icons.verified_user_rounded, color: LaasyaColors.primary, size: 26),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Permissions Required',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16.5, color: LaasyaColors.textDark),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'To receive real-time class completion alarms, attendance updates, and media features, please grant the following permissions:',
                style: TextStyle(fontSize: 12.5, color: Colors.black87, height: 1.4),
              ),
              const SizedBox(height: 16),
              _permRow(
                Icons.notifications_active_rounded,
                'Notifications & Attention Alerts',
                'Sounds 10-second alert and vibrates when class concludes to notify parents for pickup.',
                const Color(0xFFC2410C),
                const Color(0xFFFFEDD5),
              ),
              const SizedBox(height: 12),
              _permRow(
                Icons.camera_alt_rounded,
                'Camera & Photos',
                'To capture and upload profile pictures and academy media.',
                const Color(0xFF1E429F),
                const Color(0xFFE1EFFE),
              ),
            ],
          ),
          actions: [
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () async {
                      Navigator.pop(ctx);
                      final p = await SharedPreferences.getInstance();
                      await p.setBool(_prefKey, true);
                    },
                    child: const Text('Later', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(ctx);
                      final p = await SharedPreferences.getInstance();
                      await p.setBool(_prefKey, true);
                      await _grantAllPermissionsInternal();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: LaasyaColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 2,
                    ),
                    child: const Text('Grant Permissions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    } catch (e) {
      debugPrint('Permission request error: $e');
    } finally {
      _dialogShowing = false;
    }
  }

  /// Internal handler that requests clean system permissions natively and via permission_handler
  static Future<void> _grantAllPermissionsInternal() async {
    try {
      // 1. Native Android batch request (POST_NOTIFICATIONS, CAMERA, READ_MEDIA_IMAGES / STORAGE)
      await AlarmService.requestAllPermissions();

      // 2. Fallback request via permission_handler
      await [
        Permission.notification,
        Permission.camera,
        Permission.photos,
      ].request();
    } catch (e) {
      debugPrint('Error granting permissions: $e');
    }
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
              'Notifications & Alarms',
              'To sound attention alarms when class concludes and receive attendance updates.',
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
              await _grantAllPermissionsInternal();
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
