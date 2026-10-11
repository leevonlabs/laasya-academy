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
}
