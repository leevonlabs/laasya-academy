import 'dart:async';
import 'notification_service.dart';
import '../constants/api_constants.dart';

/// Backward-compatible facade over NotificationService.
/// All legacy alarms, looping sounds, and custom MP3 chimes are permanently removed.
class AlarmService {
  static Future<void> showClassCompletedNotification({
    required String courseTitle,
    required String batchName,
    required String message,
  }) => NotificationService.showClassCompletedNotification(
    courseTitle: courseTitle,
    batchName: batchName,
    message: message,
  );

  static Future<void> startAlarmRing({
    int durationSeconds = 10,
    String title = 'CLASS COMPLETED!',
    String message = 'Class session has concluded. Please come and pick up your child safely.',
  }) => NotificationService.showClassCompletedNotification(
    courseTitle: title,
    batchName: '',
    message: message,
  );

  static Future<void> stopAlarmRing() async {}
  static Future<void> playClassCompletedSound() async {}

  static Future<void> showAttendanceNotification({
    required String title,
    required String message,
    required bool isPresent,
  }) => NotificationService.showAttendanceNotification(
    title: title,
    message: message,
    isPresent: isPresent,
  );

  static Future<void> showNoticeNotification({
    required String title,
    required String message,
    String route = '/announcements',
  }) => NotificationService.showAnnouncementNotification(
    title: title,
    message: message,
    route: route,
  );

  static Future<void> requestNotificationPermission() =>
      NotificationService.requestNotificationPermission();

  static Future<void> requestAllPermissions() =>
      NotificationService.requestNotificationPermission();

  static Future<void> requestBatteryOptimization() async {}
  static Future<bool> isIgnoringBatteryOptimizations() async => true;

  static Future<void> startBackgroundAlertService({
    String role = 'student',
    required String studentId,
    required String rollNumber,
    required String name,
    required String phone,
    required String batchIds,
    String? baseUrl,
  }) => NotificationService.startBackgroundAlertService(
    role: role,
    studentId: studentId,
    rollNumber: rollNumber,
    name: name,
    phone: phone,
    batchIds: batchIds,
    baseUrl: baseUrl ?? ApiConstants.baseUrl,
  );

  static Future<void> stopBackgroundAlertService() =>
      NotificationService.stopBackgroundAlertService();

  static Future<void> markAlertProcessed(String alertId) =>
      NotificationService.markAlertProcessed(alertId);

  static Future<bool> isAlertProcessed(String alertId) =>
      NotificationService.isAlertProcessed(alertId);

  static Future<Map<String, dynamic>?> getPendingNotificationRoute() =>
      NotificationService.getPendingNotificationPayload();

  static void setNotificationOpenedHandler(Function(Map<String, dynamic>) handler) =>
      NotificationService.setNotificationOpenedHandler(handler);
}
