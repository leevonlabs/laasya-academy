import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'notification_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  debugPrint('[FCM] Background message received: ${message.messageId} | ${message.notification?.title}');

  try {
    final title = message.notification?.title ?? message.data['title']?.toString() ?? '';
    final body = message.notification?.body ?? message.data['body']?.toString() ?? '';
    final id = message.data['id']?.toString() ?? message.messageId ?? '';
    if (title.isNotEmpty || body.isNotEmpty) {
      final prefs = await SharedPreferences.getInstance();
      final cachedStr = prefs.getString('laasya_cached_messages');
      List<dynamic> list = [];
      if (cachedStr != null && cachedStr.isNotEmpty) {
        try {
          list = jsonDecode(cachedStr);
        } catch (_) {}
      }
      final exists = list.any((m) => m is Map && (m['id']?.toString() == id || (m['title'] == title && m['message'] == body)));
      if (!exists) {
        list.insert(0, {
          'id': id.isNotEmpty ? id : 'fcm-${DateTime.now().millisecondsSinceEpoch}',
          'title': title,
          'message': body,
          'publish_date': DateTime.now().toIso8601String().split('T').first,
          'created_at': DateTime.now().toIso8601String(),
          'created_by': message.data['sender']?.toString() ?? 'Academy Administration',
          'sender_role': message.data['sender_role']?.toString() ?? 'admin',
          'trainer_name': message.data['trainer_name']?.toString(),
          'trainer_avatar_url': message.data['trainer_avatar_url']?.toString(),
          'is_read': false,
        });
        await prefs.setString('laasya_cached_messages', jsonEncode(list));
      }
    }
  } catch (e) {
    debugPrint('[FCM] Background message cache error: $e');
  }
}

class FcmService {
  static bool _initialized = false;
  static String? _cachedToken;
  static const String _backendBaseUrl = 'https://laasya-academy.vercel.app';

  /// Handler for navigation or action when notification tapped
  static Function(Map<String, dynamic> data)? onNotificationTapped;

  static Future<void> initialize() async {
    if (_initialized) return;

    try {
      await Firebase.initializeApp();
      _initialized = true;

      // Background handler must be set before any messages are received
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      final messaging = FirebaseMessaging.instance;

      // Request user permission for notifications
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      debugPrint('[FCM] Notification authorization: ${settings.authorizationStatus}');

      // Enable heads-up alerts while the app is in the foreground
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // Fetch FCM Token
      _cachedToken = await messaging.getToken();
      debugPrint('[FCM] Device Token: $_cachedToken');

      // Listen for token refreshes
      messaging.onTokenRefresh.listen((newToken) {
        _cachedToken = newToken;
        _reSyncTokenWithBackend(newToken);
      });

      // Foreground message listener
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[FCM] Foreground message: ${message.notification?.title} - ${message.notification?.body}');
        final notif = message.notification;
        if (notif != null) {
          NotificationService.showAnnouncementNotification(
            title: notif.title ?? 'Laasya Academy Notice',
            message: notif.body ?? '',
          );
        }
      });

      // Tapped from background state
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[FCM] Notification opened from background: ${message.data}');
        if (onNotificationTapped != null) {
          onNotificationTapped!(message.data);
        }
      });

      // Check if launched from terminated state via notification click
      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('[FCM] App launched from terminated state via notification: ${initialMessage.data}');
        Timer(const Duration(milliseconds: 1000), () {
          if (onNotificationTapped != null) {
            onNotificationTapped!(initialMessage.data);
          }
        });
      }
    } catch (e) {
      debugPrint('[FCM] Initialization error: $e');
    }
  }

  /// Get current FCM registration token
  static Future<String?> getToken() async {
    if (_cachedToken != null) return _cachedToken;
    try {
      _cachedToken = await FirebaseMessaging.instance.getToken();
      return _cachedToken;
    } catch (e) {
      debugPrint('[FCM] Error fetching token: $e');
      return null;
    }
  }

  /// Register user device token with Vercel/Supabase backend
  static Future<void> registerDeviceToken({
    required String userId,
    required String role,
    List<String>? batchIds,
  }) async {
    final token = await getToken();
    if (token == null || token.isEmpty || userId.isEmpty) return;

    // Cache locally
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('fcm_user_id', userId);
    await prefs.setString('fcm_user_role', role);
    if (batchIds != null) {
      await prefs.setStringList('fcm_batch_ids', batchIds);
    }

    final platform = Platform.isIOS ? 'ios' : 'android';

    try {
      final response = await http.post(
        Uri.parse('$_backendBaseUrl/api/notifications/device-token'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': userId,
          'role': role,
          'token': token,
          'platform': platform,
          'batchIds': batchIds ?? [],
        }),
      ).timeout(const Duration(seconds: 10));

      debugPrint('[FCM] Token registered with backend: ${response.statusCode}');
    } catch (e) {
      debugPrint('[FCM] Failed to register token with backend: $e');
    }
  }

  /// Remove device token on logout
  static Future<void> unregisterDeviceToken() async {
    final token = await getToken();
    if (token == null) return;

    try {
      await http.delete(
        Uri.parse('$_backendBaseUrl/api/notifications/device-token'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'token': token}),
      ).timeout(const Duration(seconds: 10));
    } catch (e) {
      debugPrint('[FCM] Error unregistering token: $e');
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('fcm_user_id');
    await prefs.remove('fcm_user_role');
    await prefs.remove('fcm_batch_ids');
  }

  static Future<void> _reSyncTokenWithBackend(String newToken) async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('fcm_user_id');
    final role = prefs.getString('fcm_user_role');
    final batchIds = prefs.getStringList('fcm_batch_ids');

    if (userId != null && role != null) {
      registerDeviceToken(
        userId: userId,
        role: role,
        batchIds: batchIds,
      );
    }
  }
}
