package com.laasyaacademy.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.os.Build
import android.provider.Settings
import io.flutter.app.FlutterApplication

class LaasyaApplication : FlutterApplication() {

    companion object {
        const val CHANNEL_CLASSES = "laasya_classes"
        const val CHANNEL_ANNOUNCEMENTS = "laasya_announcements"
        const val CHANNEL_ALERTS = "laasya_class_alerts"

        fun ensureChannels(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

                val audioAttributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build()

                // 1. Channel for Announcements & Circulars (Heads-up, High Priority)
                val noticeChannel = NotificationChannel(
                    CHANNEL_ANNOUNCEMENTS,
                    "Academy Announcements",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Official announcements, notices, and messages from Academy Director & Gurus"
                    enableVibration(true)
                    enableLights(true)
                    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                    setSound(Settings.System.DEFAULT_NOTIFICATION_URI, audioAttributes)
                }
                nm.createNotificationChannel(noticeChannel)

                // 2. Channel for Classes & Attendance (Normal sound & vibration)
                val classChannel = NotificationChannel(
                    CHANNEL_CLASSES,
                    "Class & Attendance Updates",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Notifications for class completion and daily attendance updates"
                    enableVibration(true)
                    enableLights(true)
                    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                    setSound(Settings.System.DEFAULT_NOTIFICATION_URI, audioAttributes)
                }
                nm.createNotificationChannel(classChannel)

                // 3. Channel for Realtime Alerts & Direct Push
                val alertChannel = NotificationChannel(
                    CHANNEL_ALERTS,
                    "Academy Realtime Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Live priority alerts, push messages and student notifications"
                    enableVibration(true)
                    enableLights(true)
                    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                    setSound(Settings.System.DEFAULT_NOTIFICATION_URI, audioAttributes)
                }
                nm.createNotificationChannel(alertChannel)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        ensureChannels(this)
    }
}
