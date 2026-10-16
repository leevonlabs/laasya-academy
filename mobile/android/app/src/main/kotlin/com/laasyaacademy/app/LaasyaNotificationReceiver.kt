package com.laasyaacademy.app

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.os.Build
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

class LaasyaNotificationReceiver : BroadcastReceiver() {

    companion object {
        const val PREFS_NAME = "FlutterSharedPreferences"
        const val NOTIF_CHANNEL_CLASSES = "laasya_classes"
        const val NOTIF_CHANNEL_ANNOUNCEMENTS = "laasya_announcements"

        const val NOTIF_ID_CLASS_COMPLETED = 2001
        const val NOTIF_ID_ATTENDANCE = 2002
        const val NOTIF_ID_ANNOUNCEMENT = 2003

        const val ACTION_POLL_ALERTS = "com.laasyaacademy.app.ACTION_POLL_ALERTS"
        const val POLL_INTERVAL_MS = 20000L // 20 seconds for timely class conclusion notices

        fun scheduleNextPoll(context: Context, delayMs: Long = POLL_INTERVAL_MS) {
            val intent = Intent(context, LaasyaNotificationReceiver::class.java).apply {
                action = ACTION_POLL_ALERTS
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                2001,
                intent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE else PendingIntent.FLAG_UPDATE_CURRENT
            )
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager?.setAndAllowWhileIdle(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        SystemClock.elapsedRealtime() + delayMs,
                        pendingIntent
                    )
                } else {
                    alarmManager?.set(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        SystemClock.elapsedRealtime() + delayMs,
                        pendingIntent
                    )
                }
            } catch (e: Exception) {
                alarmManager?.set(
                    AlarmManager.ELAPSED_REALTIME,
                    SystemClock.elapsedRealtime() + delayMs,
                    pendingIntent
                )
            }
        }

        fun cancelPoll(context: Context) {
            val intent = Intent(context, LaasyaNotificationReceiver::class.java).apply {
                action = ACTION_POLL_ALERTS
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                2001,
                intent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE else PendingIntent.FLAG_UPDATE_CURRENT
            )
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
            alarmManager?.cancel(pendingIntent)
        }
    }

    override fun onReceive(context: Context, intent: Intent?) {
        // Automatically reschedule next poll so notifications persist even when swiped from slides
        scheduleNextPoll(context)

        val pendingResult = goAsync()
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? android.os.PowerManager
        val wakeLock = powerManager?.newWakeLock(android.os.PowerManager.PARTIAL_WAKE_LOCK, "laasya:notification_check")
        wakeLock?.acquire(15000L) // 15 seconds timeout

        // Ensure the foreground service is also running
        try {
            val serviceIntent = Intent(context, LaasyaAlertService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                androidx.core.content.ContextCompat.startForegroundService(context, serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        } catch (_: Exception) {}

        // Perform server check on background worker thread with guaranteed completion
        Thread {
            try {
                checkServerForAlerts(context)
            } catch (_: Exception) {
            } finally {
                try {
                    if (wakeLock?.isHeld == true) {
                        wakeLock.release()
                    }
                } catch (_: Exception) {}
                try {
                    pendingResult.finish()
                } catch (_: Exception) {}
            }
        }.start()
    }

    private fun checkServerForAlerts(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        var role = prefs.getString("laasya_bg_role", prefs.getString("flutter.laasya_bg_role", "")) ?: ""
        var studentId = prefs.getString("laasya_bg_student_id", prefs.getString("flutter.laasya_bg_student_id", "")) ?: ""
        var rollNumber = prefs.getString("laasya_bg_roll", prefs.getString("flutter.laasya_bg_roll", "")) ?: ""
        var name = prefs.getString("laasya_bg_name", prefs.getString("flutter.laasya_bg_name", "")) ?: ""
        var phone = prefs.getString("laasya_bg_phone", prefs.getString("flutter.laasya_bg_phone", "")) ?: ""
        var batchIds = prefs.getString("laasya_bg_batch_ids", prefs.getString("flutter.laasya_bg_batch_ids", "all")) ?: "all"
        var baseUrl = prefs.getString("laasya_bg_base_url", prefs.getString("flutter.laasya_bg_base_url", "https://laasya-academy.vercel.app")) ?: "https://laasya-academy.vercel.app"

        // Fallback: Check if saved_user_profile exists in Flutter prefs
        if (role.isEmpty() && studentId.isEmpty() && phone.isEmpty()) {
            val userJson = prefs.getString("flutter.saved_user_profile", prefs.getString("saved_user_profile", null))
            if (userJson != null && userJson.isNotEmpty()) {
                try {
                    val userObj = JSONObject(userJson)
                    role = userObj.optString("role", "student")
                    studentId = userObj.optString("id", userObj.optString("profile_id", ""))
                    rollNumber = userObj.optString("roll_number", "")
                    name = userObj.optString("full_name", "")
                    phone = userObj.optString("phone", "")
                } catch (_: Exception) {}
            }
        }

        // If user hasn't logged in on device yet, do not query
        if (role.isEmpty() && studentId.isEmpty() && phone.isEmpty()) {
            return
        }

        val effectiveBaseUrl = if (baseUrl.isNotEmpty()) baseUrl else "https://laasya-academy.vercel.app"
        val encBatch = URLEncoder.encode(if (batchIds.isEmpty()) "all" else batchIds, "UTF-8")
        val encStudentId = URLEncoder.encode(studentId, "UTF-8")
        val encRoll = URLEncoder.encode(rollNumber, "UTF-8")
        val encName = URLEncoder.encode(name, "UTF-8")
        val encPhone = URLEncoder.encode(phone, "UTF-8")
        val encRole = URLEncoder.encode(role, "UTF-8")

        val urlString = "$effectiveBaseUrl/api/sessions/alerts?batchIds=$encBatch&studentId=$encStudentId&rollNumber=$encRoll&name=$encName&phone=$encPhone&role=$encRole&sinceSeconds=300"

        var conn: HttpURLConnection? = null
        try {
            val url = URL(urlString)
            conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 6000
            conn.readTimeout = 6000
            conn.requestMethod = "GET"
            conn.setRequestProperty("Accept", "application/json")

            if (conn.responseCode == 200) {
                val reader = BufferedReader(InputStreamReader(conn.inputStream))
                val sb = StringBuilder()
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    sb.append(line)
                }
                reader.close()

                val root = JSONObject(sb.toString())
                if (root.optBoolean("success", false)) {
                    val alerts = root.optJSONArray("alerts") ?: return
                    for (i in 0 until alerts.length()) {
                        val alert = alerts.getJSONObject(i)
                        processAlert(context, alert, role)
                    }
                }
            }
        } catch (_: Exception) {
        } finally {
            conn?.disconnect()
        }
    }

    private fun processAlert(context: Context, alert: JSONObject, role: String) {
        val id = alert.optString("id", "")
        if (id.isEmpty()) return

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val seenKey = "flutter.laasya_alert_seen_$id"
        if (prefs.getBoolean(seenKey, false)) return

        // Mark as processed immediately to prevent duplicate notifications
        prefs.edit().putBoolean(seenKey, true).apply()

        val alertType = alert.optString("alert_type", "class_closed")
        val isTrainer = role.equals("trainer", ignoreCase = true) || role.equals("guru", ignoreCase = true)

        if (isTrainer) {
            // GURU RULES:
            // 1. Receives announcements, official circulars, admin notices
            // 2. NEVER plays student pickup alert, NEVER receives class conclusion alerts
            if (alertType == "message" || alertType == "announcement" || alertType == "admin_alert") {
                val title = alert.optString("course_title", alert.optString("title", "Academy Notice"))
                val msg = alert.optString("message", "New administrative circular posted.")
                showSystemNotification(context, NOTIF_ID_ANNOUNCEMENT, title, msg, NOTIF_CHANNEL_ANNOUNCEMENTS, "/messages")
            }
            return
        }

        // STUDENT RULES:
        when (alertType) {
            "class_closed" -> {
                val courseTitle = alert.optString("course_title", "Class Session")
                val batchName = alert.optString("batch_name", "Batch")
                val alertMsg = alert.optString("message", "The $courseTitle ($batchName) session has concluded. Please come and pick up your child safely.")
                showSystemNotification(context, NOTIF_ID_CLASS_COMPLETED, "CLASS COMPLETED: $courseTitle", alertMsg, NOTIF_CHANNEL_CLASSES, "/attendance")
            }
            "attendance_marked" -> {
                val status = alert.optString("student_status", "PRESENT").uppercase()
                val isPresent = status == "PRESENT"
                val courseTitle = alert.optString("course_title", "Class Session")
                val batchName = alert.optString("batch_name", "Batch")
                val trainerName = alert.optString("trainer_name", "Guru")
                val title = if (isPresent) "Attendance Confirmed: PRESENT" else "Attendance Alert: ABSENT"
                val msg = "$courseTitle • $batchName (Recorded by Guru $trainerName)"
                showSystemNotification(context, NOTIF_ID_ATTENDANCE, title, msg, NOTIF_CHANNEL_CLASSES, "/attendance")
            }
            "message", "announcement" -> {
                val title = alert.optString("course_title", alert.optString("title", "Academy Notice"))
                val msg = alert.optString("message", "New announcement received.")
                showSystemNotification(context, NOTIF_ID_ANNOUNCEMENT, title, msg, NOTIF_CHANNEL_ANNOUNCEMENTS, "/messages")
            }
        }
    }

    private fun showSystemNotification(context: Context, id: Int, title: String, message: String, channelId: String, route: String) {
        ensureNotificationChannels(context)

        val appIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("route", route)
            putExtra("title", title)
            putExtra("message", message)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            id,
            appIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE else PendingIntent.FLAG_UPDATE_CURRENT
        )

        val logo = try {
            BitmapFactory.decodeResource(context.resources, R.mipmap.ic_launcher)
        } catch (_: Exception) {
            null
        }

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(logo)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setDefaults(NotificationCompat.DEFAULT_ALL) // Standard system notification sound and vibration
            .setPriority(if (channelId == NOTIF_CHANNEL_CLASSES) NotificationCompat.PRIORITY_HIGH else NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(id, builder.build())
    }

    private fun ensureNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val classChannel = NotificationChannel(
                NOTIF_CHANNEL_CLASSES,
                "Class & Attendance Updates",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for class completion and attendance updates"
                enableVibration(true)
                enableLights(true)
            }
            nm.createNotificationChannel(classChannel)

            val noticeChannel = NotificationChannel(
                NOTIF_CHANNEL_ANNOUNCEMENTS,
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
}
