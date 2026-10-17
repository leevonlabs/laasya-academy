package com.laasyaacademy.app

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.BitmapFactory
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

class LaasyaAlertService : Service() {

    companion object {
        const val PREFS_NAME = "FlutterSharedPreferences"
        const val NOTIF_CHANNEL_SERVICE = "laasya_service"
        const val NOTIF_CHANNEL_CLASSES = "laasya_classes"
        const val NOTIF_CHANNEL_ANNOUNCEMENTS = "laasya_announcements"

        const val NOTIF_ID_FOREGROUND = 1001
        const val NOTIF_ID_CLASS_COMPLETED = 2001
        const val NOTIF_ID_ATTENDANCE = 2002
        const val NOTIF_ID_ANNOUNCEMENT = 2003

        var isAppInForeground = false
    }

    private var scheduler: ScheduledExecutorService? = null
    private var role = "student"
    private var studentId = ""
    private var rollNumber = ""
    private var name = ""
    private var phone = ""
    private var batchIds = "all"
    private var baseUrl = "https://laasya-academy.vercel.app"

    override fun onCreate() {
        super.onCreate()
        ensureNotificationChannels()
        startForegroundNotification()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForegroundNotification()

        if (intent != null) {
            role = intent.getStringExtra("role") ?: role
            studentId = intent.getStringExtra("studentId") ?: studentId
            rollNumber = intent.getStringExtra("rollNumber") ?: rollNumber
            name = intent.getStringExtra("name") ?: name
            phone = intent.getStringExtra("phone") ?: phone
            batchIds = intent.getStringExtra("batchIds") ?: batchIds
            baseUrl = intent.getStringExtra("baseUrl") ?: baseUrl

            val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit()
                .putString("laasya_bg_role", role)
                .putString("flutter.laasya_bg_role", role)
                .putString("laasya_bg_student_id", studentId)
                .putString("flutter.laasya_bg_student_id", studentId)
                .putString("laasya_bg_roll", rollNumber)
                .putString("flutter.laasya_bg_roll", rollNumber)
                .putString("laasya_bg_name", name)
                .putString("flutter.laasya_bg_name", name)
                .putString("laasya_bg_phone", phone)
                .putString("flutter.laasya_bg_phone", phone)
                .putString("laasya_bg_batch_ids", batchIds)
                .putString("flutter.laasya_bg_batch_ids", batchIds)
                .putString("laasya_bg_base_url", baseUrl)
                .putString("flutter.laasya_bg_base_url", baseUrl)
                .commit()
        } else {
            // Recreated by Android OS (START_STICKY)
            val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            role = prefs.getString("laasya_bg_role", prefs.getString("flutter.laasya_bg_role", "student")) ?: "student"
            studentId = prefs.getString("laasya_bg_student_id", prefs.getString("flutter.laasya_bg_student_id", "")) ?: ""
            rollNumber = prefs.getString("laasya_bg_roll", prefs.getString("flutter.laasya_bg_roll", "")) ?: ""
            name = prefs.getString("laasya_bg_name", prefs.getString("flutter.laasya_bg_name", "")) ?: ""
            phone = prefs.getString("laasya_bg_phone", prefs.getString("flutter.laasya_bg_phone", "")) ?: ""
            batchIds = prefs.getString("laasya_bg_batch_ids", prefs.getString("flutter.laasya_bg_batch_ids", "all")) ?: "all"
            baseUrl = prefs.getString("laasya_bg_base_url", prefs.getString("flutter.laasya_bg_base_url", "https://laasya-academy.vercel.app")) ?: "https://laasya-academy.vercel.app"
        }

        startPollingLoop()
        return START_NOT_STICKY
    }

    private fun startForegroundNotification() {
        ensureNotificationChannels()
        val appIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            1001,
            appIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE else PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = NotificationCompat.Builder(this, NOTIF_CHANNEL_SERVICE)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Laasya Academy")
            .setContentText("Connected for live attendance & notifications")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .setOngoing(false)
            .setAutoCancel(true)
            .setSilent(true)

        try {
            startForeground(NOTIF_ID_FOREGROUND, builder.build())
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE)
            } else {
                @Suppress("DEPRECATION")
                stopForeground(true)
            }
            nm.cancel(NOTIF_ID_FOREGROUND)
        } catch (_: Exception) {}
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        try {
            LaasyaNotificationReceiver.cancelPoll(applicationContext)
        } catch (_: Exception) {}
        try {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.cancel(NOTIF_ID_FOREGROUND)
        } catch (_: Exception) {}
        scheduler?.shutdownNow()
        scheduler = null
        stopSelf()
    }

    private fun startPollingLoop() {
        if (scheduler != null && !scheduler!!.isShutdown) return

        scheduler = Executors.newSingleThreadScheduledExecutor()
        scheduler?.scheduleWithFixedDelay({
            try {
                // If the app is already in the foreground, Flutter handles realtime notifications directly
                if (!isAppInForeground) {
                    checkServerForAlerts()
                }
            } catch (e: Exception) {
                // Ignore transient network hiccups
            }
        }, 1, 4, TimeUnit.SECONDS)
    }

    private fun checkServerForAlerts() {
        val effectiveBaseUrl = if (baseUrl.isNotEmpty()) baseUrl else "https://laasya-academy.vercel.app"
        val encBatch = URLEncoder.encode(if (batchIds.isEmpty()) "all" else batchIds, "UTF-8")
        val encStudentId = URLEncoder.encode(studentId, "UTF-8")
        val encRoll = URLEncoder.encode(rollNumber, "UTF-8")
        val encName = URLEncoder.encode(name, "UTF-8")
        val encPhone = URLEncoder.encode(phone, "UTF-8")
        val encRole = URLEncoder.encode(role, "UTF-8")

        val urlString = "$effectiveBaseUrl/api/sessions/alerts?batchIds=$encBatch&studentId=$encStudentId&rollNumber=$encRoll&name=$encName&phone=$encPhone&role=$encRole&sinceSeconds=120"

        var conn: HttpURLConnection? = null
        try {
            val url = URL(urlString)
            conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 5000
            conn.readTimeout = 5000
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
                        processAlert(alert)
                    }
                }
            }
        } catch (_: Exception) {
        } finally {
            conn?.disconnect()
        }
    }

    private fun processAlert(alert: JSONObject) {
        val id = alert.optString("id", "")
        if (id.isEmpty()) return

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val seenKey = "flutter.laasya_alert_seen_$id"
        if (prefs.getBoolean(seenKey, false)) return

        // Mark as processed immediately to prevent duplicate notifications
        prefs.edit().putBoolean(seenKey, true).apply()

        val alertType = alert.optString("alert_type", "class_closed")
        val isTrainer = role.equals("trainer", ignoreCase = true) || role.equals("guru", ignoreCase = true)

        if (isTrainer) {
            // GURU LOGIN RULES:
            // 1. Receives announcements, official circulars, admin notices
            // 2. NEVER plays student pickup alarm
            // 3. NEVER receives student class completed alarm or 10-second ring alert
            if (alertType == "message" || alertType == "announcement" || alertType == "admin_alert") {
                val title = alert.optString("course_title", alert.optString("title", "Academy Notice"))
                val msg = alert.optString("message", "New administrative circular posted.")
                showSystemNotification(NOTIF_ID_ANNOUNCEMENT, title, msg, NOTIF_CHANNEL_ANNOUNCEMENTS, "/messages")
            }
            return
        }

        // STUDENT LOGIN RULES:
        when (alertType) {
            "class_closed" -> {
                val courseTitle = alert.optString("course_title", "Class Session")
                val batchName = alert.optString("batch_name", "Batch")
                val alertMsg = alert.optString("message", "The $courseTitle ($batchName) session has concluded. Please come and pick up your child safely.")
                showSystemNotification(NOTIF_ID_CLASS_COMPLETED, "CLASS COMPLETED: $courseTitle", alertMsg, NOTIF_CHANNEL_CLASSES, "/attendance")
            }
            "attendance_marked" -> {
                val status = alert.optString("student_status", "PRESENT").uppercase()
                val isPresent = status == "PRESENT"
                val courseTitle = alert.optString("course_title", "Class Session")
                val batchName = alert.optString("batch_name", "Batch")
                val trainerName = alert.optString("trainer_name", "Guru")
                val title = if (isPresent) "Attendance Confirmed: PRESENT" else "Attendance Alert: ABSENT"
                val msg = "$courseTitle • $batchName (Recorded by Guru $trainerName)"
                showSystemNotification(NOTIF_ID_ATTENDANCE, title, msg, NOTIF_CHANNEL_CLASSES, "/attendance")
            }
            "message", "announcement" -> {
                val title = alert.optString("course_title", alert.optString("title", "Academy Notice"))
                val msg = alert.optString("message", "New announcement received.")
                showSystemNotification(NOTIF_ID_ANNOUNCEMENT, title, msg, NOTIF_CHANNEL_ANNOUNCEMENTS, "/messages")
            }
        }
    }

    private fun showSystemNotification(id: Int, title: String, message: String, channelId: String, route: String) {
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
            .setDefaults(NotificationCompat.DEFAULT_ALL) // Standard system ringtone and vibration
            .setPriority(if (channelId == NOTIF_CHANNEL_CLASSES) NotificationCompat.PRIORITY_HIGH else NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(id, builder.build())
    }

    private fun ensureNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

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

            val serviceChannel = NotificationChannel(
                NOTIF_CHANNEL_SERVICE,
                "Laasya Academy Live Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background sync for real-time attendance and announcements"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
            }
            nm.createNotificationChannel(serviceChannel)
        }
    }

    override fun onDestroy() {
        scheduler?.shutdownNow()
        scheduler = null
        super.onDestroy()
    }
}
