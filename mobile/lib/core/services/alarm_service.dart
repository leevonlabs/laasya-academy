import 'dart:async';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Clean System Notification Service for Laasya Cultural Academy.
/// Uses standard phone OS notifications with default ringtones and vibration.
/// All alarms, looping sounds, and custom MP3 chimes have been completely removed.
class AlarmService {
  static const MethodChannel _channel = MethodChannel('com.laasyaacademy.app/notifications');
  static bool _handlerInstalled = false;
  static Function(Map<String, dynamic>)? _notificationOpenedCallback;

  /// Shows a normal system notification for class completion (Students only)
  static Future<void> showClassCompletedNotification({
    required String courseTitle,
    required String batchName,
    required String message,
  }) async {
    try {
      await _channel.invokeMethod('showNotification', {
        'id': 2001,
        'title': 'CLASS COMPLETED: $courseTitle',
        'message': message,
        'channelId': 'laasya_classes',
        'route': '/attendance',
      });
    } catch (_) {}
  }

  /// Backward-compatible alias that fires a normal phone system notification (NO ALARM)
  static Future<void> startAlarmRing({
    int durationSeconds = 10,
    String title = 'CLASS COMPLETED!',
    String message = 'Class session has concluded. Please come and pick up your child safely.',
  }) async {
    try {
      await _channel.invokeMethod('showNotification', {
        'id': 2001,
        'title': title,
        'message': message,
        'channelId': 'laasya_classes',
        'route': '/attendance',
      });
    } catch (_) {}
  }

  /// No-op: Alarms have been completely removed
  static Future<void> stopAlarmRing() async {}

  /// No-op: Audio alarms have been completely removed
  static Future<void> playClassCompletedSound() async {}

  /// Shows a normal phone system notification for attendance status
  static Future<void> showAttendanceNotification({
    required String title,
    required String message,
    required bool isPresent,
  }) async {
    try {
      await _channel.invokeMethod('showNotification', {
        'id': 2002,
        'title': title,
        'message': message,
        'channelId': 'laasya_classes',
        'route': '/attendance',
      });
    } catch (_) {}
  }

  /// Shows a normal phone system notification for circulars, notices, and announcements
  static Future<void> showNoticeNotification({
    required String title,
    required String message,
  }) async {
    try {
      await _channel.invokeMethod('showNotification', {
        'id': 2003,
        'title': title,
        'message': message,
        'channelId': 'laasya_announcements',
        'route': '/messages',
      });
    } catch (_) {}
  }

  /// Requests runtime notification permission on Android 13+ (API 33+) and iOS
  static Future<void> requestNotificationPermission() async {
    try {
      await _channel.invokeMethod('requestNotificationPermission');
    } catch (_) {}
  }

  static Future<void> requestAllPermissions() async {
    try {
      await _channel.invokeMethod('requestNotificationPermission');
    } catch (_) {}
  }

  static Future<void> requestBatteryOptimization() async {}
  static Future<bool> isIgnoringBatteryOptimizations() async => true;
  static Future<void> startBackgroundAlertService({
    String role = 'student',
    required String studentId,
    required String rollNumber,
    required String name,
    required String phone,
    required String batchIds,
  }) async {}
  static Future<void> stopBackgroundAlertService() async {}

  /// Marks an alert as processed in SharedPreferences to prevent duplicate notifications
  static Future<void> markAlertProcessed(String alertId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('laasya_alert_seen_$alertId', true);
    } catch (_) {}
  }

  /// Checks if an alert was already processed
  static Future<bool> isAlertProcessed(String alertId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool('laasya_alert_seen_$alertId') ?? false;
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
    _notificationOpenedCallback = handler;
    if (!_handlerInstalled) {
      _handlerInstalled = true;
      _channel.setMethodCallHandler((call) async {
        if (call.method == 'onNotificationOpened' && call.arguments is Map) {
          final payload = Map<String, dynamic>.from(call.arguments);
          if (_notificationOpenedCallback != null) {
            _notificationOpenedCallback!(payload);
          }
        }
      });
    }
  }
}
