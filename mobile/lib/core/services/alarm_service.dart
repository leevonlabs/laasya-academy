import 'package:flutter/services.dart';

class AlarmService {
  static const MethodChannel _channel = MethodChannel('com.laasyaacademy.app/alarm');

  /// Starts the device's native loud alarm ringtone & vibrations for 10 seconds.
  /// Also fires a heads-up system notification with a "STOP RINGING" action button so it alerts even when the user is not live on the screen.
  static Future<void> startAlarmRing({
    int durationSeconds = 10,
    String title = 'CLASS COMPLETED!',
    String message = 'Class session has concluded. Please come and take your child back safely.',
  }) async {
    try {
      await _channel.invokeMethod('startAlarmRing', {
        'duration': durationSeconds,
        'title': title,
        'message': message,
      });
    } catch (_) {
      // Fallback
      SystemSound.play(SystemSoundType.alert);
      HapticFeedback.heavyImpact();
    }
  }

  /// Stops the alarm ring and vibration immediately.
  static Future<void> stopAlarmRing() async {
    try {
      await _channel.invokeMethod('stopAlarmRing');
    } catch (_) {}
  }

  /// Shows a high-priority Android system notification for attendance status.
  /// Appears in the system status bar even when the app is minimized or phone is locked.
  static Future<void> showAttendanceNotification({
    required String title,
    required String message,
    required bool isPresent,
  }) async {
    try {
      await _channel.invokeMethod('showAttendanceNotification', {
        'title': title,
        'message': message,
        'isPresent': isPresent,
      });
    } catch (_) {}
  }

  /// Requests runtime notification permission on Android 13+ (API 33+)
  static Future<void> requestNotificationPermission() async {
    try {
      await _channel.invokeMethod('requestNotificationPermission');
    } catch (_) {}
  }

  /// Requests all permissions (Notifications, Camera, Photos/Media) via native Android
  static Future<void> requestAllPermissions() async {
    try {
      await _channel.invokeMethod('requestAllPermissions');
    } catch (_) {}
  }

  /// Requests battery optimization exemption so alarms trigger even when app is closed / screen is locked
  static Future<void> requestBatteryOptimization() async {
    try {
      await _channel.invokeMethod('requestBatteryOptimization');
    } catch (_) {}
  }

  /// Checks if battery optimization is currently ignored
  static Future<bool> isIgnoringBatteryOptimizations() async {
    try {
      final res = await _channel.invokeMethod<bool>('isIgnoringBatteryOptimizations');
      return res ?? true;
    } catch (_) {
      return true;
    }
  }

  /// Starts the persistent background foreground service (START_STICKY) that monitors
  /// class completion alerts even when the app is closed, killed, or swiped from recent history.
  static Future<void> startBackgroundAlertService({
    required String studentId,
    required String rollNumber,
    required String name,
    required String phone,
    required String batchIds,
  }) async {
    try {
      await _channel.invokeMethod('startBackgroundAlertService', {
        'student_id': studentId,
        'roll_number': rollNumber,
        'name': name,
        'phone': phone,
        'batch_ids': batchIds,
      });
    } catch (_) {}
  }

  /// Stops the background foreground alert service (e.g. upon student sign out)
  static Future<void> stopBackgroundAlertService() async {
    try {
      await _channel.invokeMethod('stopBackgroundAlertService');
    } catch (_) {}
  }

  /// Marks an alert as processed in the native SharedPreferences so the background service skips it
  static Future<void> markAlertProcessed(String alertId) async {
    try {
      await _channel.invokeMethod('markAlertProcessed', {'alert_id': alertId});
    } catch (_) {}
  }

  /// Checks if an alert was already processed by the native service
  static Future<bool> isAlertProcessed(String alertId) async {
    try {
      final res = await _channel.invokeMethod<bool>('isAlertProcessed', {'alert_id': alertId});
      return res ?? false;
    } catch (_) {
      return false;
    }
  }
}
