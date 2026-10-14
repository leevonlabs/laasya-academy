package com.laasyaacademy.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
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
        const val ACTION_START_MONITORING = "com.laasyaacademy.app.START_MONITORING"
        const val ACTION_STOP_MONITORING = "com.laasyaacademy.app.STOP_MONITORING"
        const val ACTION_STOP_ALARM = "com.laasyaacademy.app.ACTION_STOP_ALARM"

        const val CHANNEL_MONITORING = "laasya_monitoring_channel_v4"
        const val CHANNEL_CLASS_ALERTS = "laasya_class_completed_chime_v4"
        const val CHANNEL_ATTENDANCE = "laasya_attendance_channel_v4"
        const val CHANNEL_NOTICES = "laasya_notices_channel_v4"

        const val NOTIF_ID_FOREGROUND = 101
        const val NOTIF_ID_ALARM = 1001
        const val NOTIF_ID_ATTENDANCE = 1002
        const val NOTIF_ID_NOTICE = 1003

        var isAlarmRinging = false
            private set

        private var instance: LaasyaAlertService? = null

        fun stopActiveAlarm() {
            instance?.stopAlarmSound()
        }
    }

    private var scheduler: ScheduledExecutorService? = null
    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var alarmStopRunnable: Runnable? = null
    private var isFirstPoll = true

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannels()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        instance = this

        if (intent != null) {
            when (intent.action) {
                ACTION_STOP_ALARM -> {
                    stopAlarmSound()
                    return START_STICKY
                }
                ACTION_STOP_MONITORING -> {
                    stopMonitoring()
                    stopForeground(true)
                    stopSelf()
                    return START_NOT_STICKY
                }
                ACTION_START_MONITORING -> {
                    val role = intent.getStringExtra("role") ?: "student"
                    val studentId = intent.getStringExtra("student_id") ?: ""
                    val rollNumber = intent.getStringExtra("roll_number") ?: ""
                    val name = intent.getStringExtra("name") ?: ""
                    val phone = intent.getStringExtra("phone") ?: ""
                    val batchIds = intent.getStringExtra("batch_ids") ?: "all"

                    saveMonitoringConfig(role, studentId, rollNumber, name, phone, batchIds)
                    startForegroundNotification()
                    startPollingLoop()
                    return START_STICKY
                }
            }
        }

        // Restart by OS (START_STICKY)
        startForegroundNotification()
        startPollingLoop()
        return START_STICKY
    }

    override fun onDestroy() {
        stopMonitoring()
        if (instance == this) instance = null
        super.onDestroy()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // 1. Silent persistent channel for foreground service
            val monitorChannel = NotificationChannel(
                CHANNEL_MONITORING,
                "Background Alert Monitor",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors real-time class completion chimes and updates when app is closed"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
            }
            nm.createNotificationChannel(monitorChannel)

            // 2. High priority channel with custom vocal pickup chime (R.raw.class_completed)
            val soundUri = Uri.parse("${ContentResolver.SCHEME_ANDROID_RESOURCE}://${packageName}/${R.raw.class_completed}")
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            val alertChannel = NotificationChannel(
                CHANNEL_CLASS_ALERTS,
                "Class Conclusion Pickup Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Plays custom vocal chime ('Class is over, hooray hooray!') when class concludes"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 500, 200, 500)
                setSound(soundUri, audioAttributes)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            nm.createNotificationChannel(alertChannel)

            // 3. Attendance Channel
            val attChannel = NotificationChannel(
                CHANNEL_ATTENDANCE,
                "Attendance Updates",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Live roll-call attendance marked by Gurus"
                enableVibration(true)
            }
            nm.createNotificationChannel(attChannel)

            // 4. Notices & Announcements Channel
            val noticeChannel = NotificationChannel(
                CHANNEL_NOTICES,
                "Academy Circulars & Notices",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Official broadcasts and messages from Academy Administration"
                enableVibration(true)
            }
            nm.createNotificationChannel(noticeChannel)
        }
    }

    private fun startForegroundNotification() {
        val appIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, appIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val logo = try {
            BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
        } catch (_: Exception) { null }

        val notif = NotificationCompat.Builder(this, CHANNEL_MONITORING)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(logo)
            .setColor(0xFF8A064D.toInt())
            .setContentTitle("Laasya Cultural Academy")
            .setContentText("Active Alert Monitor: Ready for pickup chimes & class updates")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setSilent(true)
            .setContentIntent(pendingIntent)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID_FOREGROUND, notif, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIF_ID_FOREGROUND, notif)
        }
    }

    private fun saveMonitoringConfig(role: String, studentId: String, rollNumber: String, name: String, phone: String, batchIds: String) {
        val prefs = getSharedPreferences("laasya_monitoring", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("role", role)
            .putString("student_id", studentId)
            .putString("roll_number", rollNumber)
            .putString("name", name)
            .putString("phone", phone)
            .putString("batch_ids", batchIds)
            .putBoolean("is_active", true)
            .apply()
    }

    private fun startPollingLoop() {
        if (scheduler != null && !scheduler!!.isShutdown) return

        scheduler = Executors.newSingleThreadScheduledExecutor()
        scheduler?.scheduleWithFixedDelay({
            try {
                pollAlertsOnce()
            } catch (_: Exception) {}
        }, 1, 3, TimeUnit.SECONDS)
    }

    private fun stopMonitoring() {
        try {
            scheduler?.shutdownNow()
            scheduler = null
            stopAlarmSound()
            val prefs = getSharedPreferences("laasya_monitoring", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("is_active", false).apply()
        } catch (_: Exception) {}
    }

    private fun pollAlertsOnce() {
        val prefs = getSharedPreferences("laasya_monitoring", Context.MODE_PRIVATE)
        val isActive = prefs.getBoolean("is_active", false)
        if (!isActive) return

        val role = prefs.getString("role", "student") ?: "student"
        val studentId = prefs.getString("student_id", "") ?: ""
        val rollNumber = prefs.getString("roll_number", "") ?: ""
        val name = prefs.getString("name", "") ?: ""
        val phone = prefs.getString("phone", "") ?: ""
        val batchIds = prefs.getString("batch_ids", "all") ?: "all"

        if (studentId.isEmpty() && rollNumber.isEmpty() && name.isEmpty() && phone.isEmpty()) return

        val encSId = URLEncoder.encode(studentId, "UTF-8")
        val encRoll = URLEncoder.encode(rollNumber, "UTF-8")
        val encName = URLEncoder.encode(name, "UTF-8")
        val encPhone = URLEncoder.encode(phone, "UTF-8")
        val encBatch = URLEncoder.encode(batchIds, "UTF-8")
        val encRole = URLEncoder.encode(role, "UTF-8")

        val urlString = "https://laasya-academy.vercel.app/api/sessions/alerts?batchIds=$encBatch&studentId=$encSId&rollNumber=$encRoll&name=$encName&phone=$encPhone&role=$encRole&sinceSeconds=300"

        var connection: HttpURLConnection? = null
        var pollWakeLock: PowerManager.WakeLock? = null
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
            pollWakeLock = powerManager?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "laasya:poll_lock")
            pollWakeLock?.acquire(4000L)

            val url = URL(urlString)
            connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.instanceFollowRedirects = true
            connection.setRequestProperty("Accept", "application/json")
            connection.setRequestProperty("User-Agent", "LaasyaAcademyApp/1.0")
            connection.connectTimeout = 4000
            connection.readTimeout = 4000

            if (connection.responseCode == 200) {
                val reader = BufferedReader(InputStreamReader(connection.inputStream))
                val response = reader.readText()
                reader.close()

                val json = JSONObject(response)
                if (json.optBoolean("success", false)) {
                    val alerts = json.optJSONArray("alerts")
                    if (alerts != null && alerts.length() > 0) {
                        val nowMs = System.currentTimeMillis()
                        for (i in 0 until alerts.length()) {
                            val alert = alerts.getJSONObject(i)
                            val id = alert.optString("id", "")
                            if (id.isEmpty()) continue

                            val createdAtMs = alert.optLong("created_at_ms", 0L)
                            val isRecent = createdAtMs > 0 && (nowMs - createdAtMs) < 180000L // 3 minutes window

                            // On initial poll, discard ancient alerts older than 3 minutes, but DO NOT discard fresh alerts!
                            if (isFirstPoll && !isRecent) {
                                markAlertProcessed(id)
                                continue
                            }

                            if (!isAlertProcessed(id)) {
                                markAlertProcessed(id)

                                val alertType = alert.optString("alert_type", "class_closed")

                                if (role == "student") {
                                    if (alertType == "class_closed") {
                                        val courseTitle = alert.optString("course_title", "Classical Dance")
                                        val batchName = alert.optString("batch_name", "Session")
                                        mainHandler.post {
                                            triggerClassCompletedAlarm(courseTitle, batchName)
                                        }
                                        break
                                    } else if (alertType == "attendance_marked") {
                                        val status = alert.optString("student_status", "present").uppercase()
                                        val isPresent = status == "PRESENT"
                                        val courseTitle = alert.optString("course_title", "Class Session")
                                        val batchName = alert.optString("batch_name", "Batch")
                                        val trainerName = alert.optString("trainer_name", "Guru")
                                        mainHandler.post {
                                            showAttendanceNotification(
                                                "Attendance Confirmed: $status",
                                                "$courseTitle ($batchName) • Recorded by Guru $trainerName",
                                                isPresent
                                            )
                                        }
                                    } else if (alertType == "message" || alertType == "announcement") {
                                        val title = alert.optString("course_title", "Academy Notice")
                                        val msg = alert.optString("message", "New announcement received.")
                                        mainHandler.post {
                                            showNoticeNotification(title, msg)
                                        }
                                    }
                                } else {
                                    // Guru role: receives announcements, messages, or session updates
                                    if (alertType == "message" || alertType == "announcement" || alertType == "admin_alert") {
                                        val title = alert.optString("course_title", "Academy Broadcast")
                                        val msg = alert.optString("message", "Important update from Administration.")
                                        mainHandler.post {
                                            showNoticeNotification(title, msg)
                                        }
                                    }
                                }
                            }
                        }
                        isFirstPoll = false
                    } else {
                        isFirstPoll = false
                    }
                }
            }
        } catch (_: Exception) {
        } finally {
            connection?.disconnect()
            if (pollWakeLock?.isHeld == true) {
                try { pollWakeLock.release() } catch (_: Exception) {}
            }
        }
    }

    private fun isAlertProcessed(alertId: String): Boolean {
        val prefs = getSharedPreferences("laasya_processed_alerts", Context.MODE_PRIVATE)
        return prefs.getBoolean(alertId, false)
    }

    private fun markAlertProcessed(alertId: String) {
        val prefs = getSharedPreferences("laasya_processed_alerts", Context.MODE_PRIVATE)
        prefs.edit().putBoolean(alertId, true).apply()
    }

    /**
     * Triggers the custom vocal pickup chime ("Class is over, hooray hooray! Parents come and pick us today...")
     * and screen wakeup when app is closed or locked.
     */
    fun triggerClassCompletedAlarm(courseTitle: String, batchName: String) {
        stopAlarmSound()
        isAlarmRinging = true

        try {
            // 1. Wake screen and turn device display ON
            val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
            wakeLock = powerManager?.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                "laasya:alarm_wake"
            )
            wakeLock?.acquire(14000L)

            // 2. Play custom vocal pickup chime (R.raw.class_completed)
            try {
                val audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()

                mediaPlayer = try {
                    MediaPlayer.create(applicationContext, R.raw.class_completed, audioAttributes, 0)?.apply {
                        setVolume(1.0f, 1.0f)
                        isLooping = false
                        start()
                    }
                } catch (_: Exception) {
                    MediaPlayer.create(applicationContext, R.raw.class_completed)?.apply {
                        setVolume(1.0f, 1.0f)
                        isLooping = false
                        start()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // 3. Vibrate device with rhythmic alert cadence
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            val pattern = longArrayOf(0, 500, 200, 500, 200, 500, 200, 500)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, -1)
            }

            // 4. Fire high-priority Heads-Up Notification with "DISMISS" Action
            showRingingHeadsUpNotification(
                "CLASS COMPLETED: $courseTitle",
                "The $courseTitle ($batchName) session has concluded. Please come and pick up your child safely."
            )

            // 5. Automatically stop after 11 seconds (duration of vocal chime)
            alarmStopRunnable = Runnable {
                stopAlarmSound()
            }
            mainHandler.postDelayed(alarmStopRunnable!!, 11000L)

        } catch (e: Exception) {
            e.printStackTrace()
            stopAlarmSound()
        }
    }

    private fun showRingingHeadsUpNotification(title: String, message: String) {
        val appIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("route", "/attendance")
            putExtra("title", title)
            putExtra("message", message)
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, appIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val stopIntent = Intent(this, AlarmStopReceiver::class.java)
        val stopPendingIntent = PendingIntent.getBroadcast(
            this, 1, stopIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val logo = try {
            BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
        } catch (_: Exception) { null }

        val soundUri = Uri.parse("${ContentResolver.SCHEME_ANDROID_RESOURCE}://${packageName}/${R.raw.class_completed}")

        val notif = NotificationCompat.Builder(this, CHANNEL_CLASS_ALERTS)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(logo)
            .setColor(0xFF8A064D.toInt())
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setSound(soundUri)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "DISMISS", stopPendingIntent)
            .build()

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIF_ID_ALARM, notif)
    }

    fun showAttendanceNotification(title: String, message: String, isPresent: Boolean) {
        val appIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("route", "/attendance")
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 2, appIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val logo = try {
            BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
        } catch (_: Exception) { null }

        val notif = NotificationCompat.Builder(this, CHANNEL_ATTENDANCE)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(logo)
            .setColor(if (isPresent) 0xFF0D7446.toInt() else 0xFFDC2626.toInt())
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIF_ID_ATTENDANCE, notif)
    }

    fun showNoticeNotification(title: String, message: String) {
        val appIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("route", "/announcements")
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 3, appIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val logo = try {
            BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
        } catch (_: Exception) { null }

        val notif = NotificationCompat.Builder(this, CHANNEL_NOTICES)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(logo)
            .setColor(0xFF8A064D.toInt())
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIF_ID_NOTICE, notif)
    }

    fun stopAlarmSound() {
        try {
            alarmStopRunnable?.let { mainHandler.removeCallbacks(it) }
            alarmStopRunnable = null

            mediaPlayer?.let {
                if (it.isPlaying) it.stop()
                it.release()
            }
            mediaPlayer = null

            vibrator?.cancel()
            vibrator = null

            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
            wakeLock = null

            isAlarmRinging = false

            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.cancel(NOTIF_ID_ALARM)
        } catch (_: Exception) {}
    }
}
