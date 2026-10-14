import 'package:flutter/services.dart';

class AlarmService {
  static const MethodChannel _channel = MethodChannel('com.laasyaacademy.app/alarm');

  /// Plays the custom vocal pickup chime ("Class is over, hooray hooray! Parents come and pick us today...")
  /// Fired on Guru's phone upon pressing "Class Completed", and on student/parent devices.
  static Future<void> playClassCompletedSound() async {
    try {
      await _channel.invokeMethod('playClassCompletedSound');
    } catch (_) {
      SystemSound.play(SystemSoundType.alert);
      HapticFeedback.mediumImpact();
    }
  }

  /// Starts the custom vocal pickup chime ("Class is over...") & vibration.
  /// Also fires a heads-up system notification with a "DISMISS" action button.
  static Future<void> startAlarmRing({
    int durationSeconds = 11,
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

  /// Shows a high-priority system notification for attendance status.
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

  /// Requests runtime notification permission on Android 13+ (API 33+) and iOS
  static Future<void> requestNotificationPermission() async {
    try {
      await _channel.invokeMethod('requestNotificationPermission');
    } catch (_) {}
  }

  /// Requests all required permissions (Notifications, Camera, Media)
  static Future<void> requestAllPermissions() async {
    try {
      await _channel.invokeMethod('requestAllPermissions');
    } catch (_) {}
  }

  /// Prompts user to exempt app from battery optimizations so alarms ring even when app is closed / phone locked
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

  /// Starts the persistent background alert service (START_STICKY) that monitors
  /// class completion alerts even when the app is closed, killed, or swiped from recent history.
  static Future<void> startBackgroundAlertService({
    String role = 'student',
    required String studentId,
    required String rollNumber,
    required String name,
    required String phone,
    required String batchIds,
  }) async {
    try {
      await _channel.invokeMethod('startBackgroundAlertService', {
        'role': role,
        'student_id': studentId,
        'roll_number': rollNumber,
        'name': name,
        'phone': phone,
        'batch_ids': batchIds,
      });
    } catch (_) {}
  }

  /// Stops the background alert service (e.g. upon user sign out)
  static Future<void> stopBackgroundAlertService() async {
    try {
      await _channel.invokeMethod('stopBackgroundAlertService');
    } catch (_) {}
  }

  /// Marks an alert as processed in the native SharedPreferences so it skips duplicates
  static Future<void> markAlertProcessed(String alertId) async {
    try {
      await _channel.invokeMethod('markAlertProcessed', {'alert_id': alertId});
    } catch (_) {}
  }

  /// Checks if an alert was already processed
  static Future<bool> isAlertProcessed(String alertId) async {
    try {
      final res = await _channel.invokeMethod<bool>('isAlertProcessed', {'alert_id': alertId});
      return res ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Checks if the app was launched by tapping a system notification
  static Future<Map<String, dynamic>?> getPendingNotificationRoute() async {
    try {
      final res = await _channel.invokeMethod('getPendingNotificationRoute');
      if (res is Map) {
        return Map<String, dynamic>.from(res);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Sets a listener for notification taps when the app is already open
  static void setNotificationOpenedHandler(Function(Map<String, dynamic>) handler) {
    _channel.setMethodCallHandler((call) async {
      if (call.method == 'onNotificationOpened' && call.arguments is Map) {
        handler(Map<String, dynamic>.from(call.arguments));
      }
    });
  }
}
