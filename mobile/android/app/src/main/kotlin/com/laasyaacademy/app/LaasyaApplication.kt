package com.laasyaacademy.app

import android.app.Application
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build

class LaasyaApplication : Application() {

    companion object {
        const val CHANNEL_CLASS_ALERTS = "laasya_class_alerts_v5"
        const val CHANNEL_ATTENDANCE = "laasya_attendance_channel_v5"
        const val CHANNEL_NOTICES = "laasya_notices_channel_v5"

        fun ensureNotificationChannels(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

                val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                    ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

                val audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()

                // 10-second rhythmic vibration pattern: 1s on, 0.4s off across 10 seconds
                val tenSecVibratePattern = longArrayOf(
                    0, 1000, 400, 1000, 400, 1000, 400, 1000, 400, 1000, 400, 1000, 400, 1000
                )

                // 1. Channel for Class Completed Pickup Alerts (Students only)
                val alertChannel = NotificationChannel(
                    CHANNEL_CLASS_ALERTS,
                    "Class Conclusion Pickup Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Alerts parents when class concludes with 10-second alert sound and vibration"
                    enableVibration(true)
                    vibrationPattern = tenSecVibratePattern
                    setSound(defaultSoundUri, audioAttributes)
                    lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                }
                nm.createNotificationChannel(alertChannel)

                // 2. Channel for Attendance Updates
                val attChannel = NotificationChannel(
                    CHANNEL_ATTENDANCE,
                    "Attendance Updates",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Live attendance status marked by Gurus"
                    enableVibration(true)
                    setSound(defaultSoundUri, audioAttributes)
                    lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                }
                nm.createNotificationChannel(attChannel)

                // 3. Channel for Academy Notices & Announcements (Gurus & Students)
                val noticeChannel = NotificationChannel(
                    CHANNEL_NOTICES,
                    "Academy Circulars & Notices",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Official broadcasts and circulars from Academy Administration"
                    enableVibration(true)
                    setSound(defaultSoundUri, audioAttributes)
                    lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                }
                nm.createNotificationChannel(noticeChannel)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        ensureNotificationChannels(this)
    }
}
