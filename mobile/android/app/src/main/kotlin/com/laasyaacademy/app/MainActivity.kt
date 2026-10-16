package com.laasyaacademy.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.os.Build
import androidx.annotation.NonNull
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    companion object {
        const val CHANNEL_NAME = "com.laasyaacademy.app/notifications"

        const val CHANNEL_CLASSES = "laasya_classes"
        const val CHANNEL_ANNOUNCEMENTS = "laasya_announcements"

        const val NOTIF_ID_CLASS_COMPLETED = 2001
        const val NOTIF_ID_ATTENDANCE = 2002
        const val NOTIF_ID_ANNOUNCEMENT = 2003
    }

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        createNotificationChannels()
    }

    override fun onNewIntent(newIntent: Intent) {
        super.onNewIntent(newIntent)
        setIntent(newIntent)
        handleNotificationIntent(newIntent)
    }

    private fun handleNotificationIntent(intent: Intent?) {
        val route = intent?.getStringExtra("route")
        if (route != null && flutterEngine != null) {
            val payload = mapOf(
                "route" to route,
                "title" to (intent.getStringExtra("title") ?: ""),
                "message" to (intent.getStringExtra("message") ?: "")
            )
            intent.removeExtra("route")
            MethodChannel(flutterEngine!!.dartExecutor.binaryMessenger, CHANNEL_NAME)
                .invokeMethod("onNotificationOpened", payload)
        }
    }

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL_NAME).setMethodCallHandler { call, result ->
            when (call.method) {
                "showNotification" -> {
                    val id = call.argument<Int>("id") ?: NOTIF_ID_CLASS_COMPLETED
                    val title = call.argument<String>("title") ?: "Laasya Academy"
                    val message = call.argument<String>("message") ?: ""
                    val channelId = call.argument<String>("channelId") ?: CHANNEL_CLASSES
                    val route = call.argument<String>("route") ?: "/attendance"

                    showSystemNotification(id, title, message, channelId, route)
                    result.success(true)
                }
                "getPendingNotificationRoute" -> {
                    val route = intent?.getStringExtra("route")
                    val data = if (route != null) {
                        mapOf(
                            "route" to route,
                            "title" to (intent?.getStringExtra("title") ?: ""),
                            "message" to (intent?.getStringExtra("message") ?: "")
                        )
                    } else null
                    intent?.removeExtra("route")
                    result.success(data)
                }
                "requestNotificationPermission" -> {
                    requestNotificationPermission()
                    result.success(true)
                }
                "startBackgroundAlertService" -> {
                    val role = call.argument<String>("role") ?: "student"
                    val studentId = call.argument<String>("studentId") ?: ""
                    val rollNumber = call.argument<String>("rollNumber") ?: ""
                    val name = call.argument<String>("name") ?: ""
                    val phone = call.argument<String>("phone") ?: ""
                    val batchIds = call.argument<String>("batchIds") ?: "all"
                    val baseUrl = call.argument<String>("baseUrl") ?: "https://laasya-academy.vercel.app"

                    val sIntent = Intent(this, LaasyaAlertService::class.java).apply {
                        putExtra("role", role)
                        putExtra("studentId", studentId)
                        putExtra("rollNumber", rollNumber)
                        putExtra("name", name)
                        putExtra("phone", phone)
                        putExtra("batchIds", batchIds)
                        putExtra("baseUrl", baseUrl)
                    }
                    try {
                        startService(sIntent)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                    try {
                        LaasyaNotificationReceiver.scheduleNextPoll(this, 1000L)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                    result.success(true)
                }
                "stopBackgroundAlertService" -> {
                    try {
                        stopService(Intent(this, LaasyaAlertService::class.java))
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                    try {
                        LaasyaNotificationReceiver.cancelPoll(this)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                    result.success(true)
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        LaasyaAlertService.isAppInForeground = true
    }

    override fun onPause() {
        super.onPause()
        LaasyaAlertService.isAppInForeground = false
    }

    private fun showSystemNotification(id: Int, title: String, message: String, channelId: String, route: String) {
        createNotificationChannels()

        val appIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("route", route)
            putExtra("title", title)
            putExtra("message", message)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            id,
            appIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE else PendingIntent.FLAG_UPDATE_CURRENT
        )

        val logo = try {
            BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
        } catch (_: Exception) {
            null
        }

        val builder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(logo)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setDefaults(NotificationCompat.DEFAULT_ALL) // Normal system ringtone and vibration
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(id, builder.build())
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // 1. Channel for Classes & Attendance (Normal system sound & vibration)
            val classChannel = NotificationChannel(
                CHANNEL_CLASSES,
                "Class & Attendance Updates",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for class completion and attendance updates"
                enableVibration(true)
                enableLights(true)
            }
            nm.createNotificationChannel(classChannel)

            // 2. Channel for Announcements (Normal system sound)
            val noticeChannel = NotificationChannel(
                CHANNEL_ANNOUNCEMENTS,
                "Academy Announcements",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Official announcements and circulars from Academy Administration"
                enableVibration(true)
                enableLights(true)
            }
            nm.createNotificationChannel(noticeChannel)
        }
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }
    }
}
