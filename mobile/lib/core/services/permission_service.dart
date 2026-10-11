import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../constants/colors.dart';

class PermissionService {
  static bool _hasRequested = false;

  /// Requests all necessary permissions on app startup / after install
  static Future<void> requestAppPermissions(BuildContext context) async {
    if (_hasRequested) return;
    _hasRequested = true;

    try {
      // 1. Request Notification permission (Crucial for 5-sec class completed attention alarm)
      final notifStatus = await Permission.notification.status;
      if (!notifStatus.isGranted) {
        await Permission.notification.request();
      }

      // 2. Request Camera permission
      final cameraStatus = await Permission.camera.status;
      if (!cameraStatus.isGranted) {
        await Permission.camera.request();
      }

      // 3. Request Photos / Storage permission
      final photosStatus = await Permission.photos.status;
      if (!photosStatus.isGranted) {
        await Permission.photos.request();
      }
    } catch (e) {
      debugPrint('Permission request notice: $e');
    }
  }

  /// Shows an explanation dialog if user wants to see what permissions are needed
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
              'Laasya Cultural Academy requires the following permissions for full functionality:',
              style: TextStyle(fontSize: 12.5, color: Colors.black87),
            ),
            const SizedBox(height: 14),
            _permRow(Icons.notifications_active_rounded, 'Notifications & Alarms', 'To sound attention alarms when class concludes and receive notices.'),
            const SizedBox(height: 10),
            _permRow(Icons.camera_alt_rounded, 'Camera', 'To capture profile images for gurus and disciples.'),
            const SizedBox(height: 10),
            _permRow(Icons.photo_library_rounded, 'Photos & Storage', 'To view and upload academy media.'),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await [
                Permission.notification,
                Permission.camera,
                Permission.photos,
              ].request();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: LaasyaColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Grant Permissions', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  static Widget _permRow(IconData icon, String title, String desc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: LaasyaColors.primary),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              Text(desc, style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ),
        ),
      ],
    );
  }
}
