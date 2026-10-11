package com.laasyaacademy.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.Ringtone
import android.media.RingtoneManager
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

        const val CHANNEL_MONITORING = "laasya_monitoring_channel"
        const val CHANNEL_CLASS_ALERTS = "laasya_class_alerts_channel"
        const val CHANNEL_ATTENDANCE = "laasya_attendance_channel"

        const val NOTIF_ID_FOREGROUND = 101
        const val NOTIF_ID_ALARM = 1001

        var isAlarmRinging = false
            private set

        private var instance: LaasyaAlertService? = null

        fun stopActiveAlarm() {
            instance?.stopAlarmSound()
        }
    }

    private var scheduler: ScheduledExecutorService? = null
    private var mediaPlayer: MediaPlayer? = null
    private var ringtone: Ringtone? = null
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
                    val studentId = intent.getStringExtra("student_id") ?: ""
                    val rollNumber = intent.getStringExtra("roll_number") ?: ""
                    val name = intent.getStringExtra("name") ?: ""
                    val phone = intent.getStringExtra("phone") ?: ""
                    val batchIds = intent.getStringExtra("batch_ids") ?: "all"

                    saveMonitoringConfig(studentId, rollNumber, name, phone, batchIds)
                    startForegroundNotification()
                    startPollingLoop()
                    return START_STICKY
                }
            }
        }

        // Default or restart by OS after being killed (START_STICKY)
        startForegroundNotification()
        startPollingLoop()
        return START_STICKY
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // 1. Silent persistent channel for foreground monitoring
            val monitorChannel = NotificationChannel(
                CHANNEL_MONITORING,
                "Class Alert Monitoring",
                NotificationManager.IMPORTANCE_MIN
            ).apply {
                description = "Monitors real-time class conclusion alarms and roll-call status"
                setShowBadge(false)
            }
            nm.createNotificationChannel(monitorChannel)

            // 2. High priority channel for 10-second attention ringtone
            val alertChannel = NotificationChannel(
                CHANNEL_CLASS_ALERTS,
                "Class Closure Attention Ring",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Urgent attention alarm when class finishes"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 800, 200, 800, 200, 800)
                setSound(
                    RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                        ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
            }
            nm.createNotificationChannel(alertChannel)

            // 3. High priority channel for attendance
            val attChannel = NotificationChannel(
                CHANNEL_ATTENDANCE,
                "Attendance Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Live attendance status marked by Gurus"
                enableVibration(true)
            }
            nm.createNotificationChannel(attChannel)
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
            .setColor(0xFF800020.toInt())
            .setContentTitle("Laasya Cultural Academy")
            .setContentText("Live class completion & pickup alerts active")
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()

        startForeground(NOTIF_ID_FOREGROUND, notif)
    }

    private fun saveMonitoringConfig(studentId: String, rollNumber: String, name: String, phone: String, batchIds: String) {
        val prefs = getSharedPreferences("laasya_monitoring", Context.MODE_PRIVATE)
        prefs.edit()
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
            } catch (e: Exception) {
                // Ignore transient network hiccups
            }
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

        val urlString = "https://laasyaacademy.com/api/sessions/alerts?batchIds=$encBatch&studentId=$encSId&rollNumber=$encRoll&name=$encName&phone=$encPhone&sinceSeconds=180"

        var connection: HttpURLConnection? = null
        try {
            val url = URL(urlString)
            connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
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
                        if (isFirstPoll) {
                            isFirstPoll = false
                            // On initial startup poll, mark all existing alerts as seen so historical alerts never ring
                            for (i in 0 until alerts.length()) {
                                val alert = alerts.getJSONObject(i)
                                val id = alert.optString("id", "")
                                if (id.isNotEmpty()) {
                                    markAlertProcessed(id)
                                }
                            }
                            return
                        }

                        for (i in 0 until alerts.length()) {
                            val alert = alerts.getJSONObject(i)
                            val id = alert.optString("id", "")
                            if (id.isNotEmpty() && !isAlertProcessed(id)) {
                                markAlertProcessed(id)

                                val alertType = alert.optString("alert_type", "class_closed")
                                if (alertType == "class_closed") {
                                    val courseTitle = alert.optString("course_title", "Classical Class")
                                    val batchName = alert.optString("batch_name", "Session")
                                    mainHandler.post {
                                        triggerTenSecondClassCompletedAlarm(courseTitle, batchName)
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
                                }
                            }
                        }
                    } else {
                        isFirstPoll = false
                    }
                }
            }
        } finally {
            connection?.disconnect()
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
     * Triggers the 10-second loud alarm ringtone & continuous vibration.
     * Wakes up the mobile device screen even when phone is locked or screen is off.
     */
    fun triggerTenSecondClassCompletedAlarm(courseTitle: String, batchName: String) {
        stopAlarmSound()
        isAlarmRinging = true

        try {
            // 1. Acquire WakeLock and turn device screen ON
            val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
            wakeLock = powerManager?.newWakeLock(
                PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                "laasya:alarm_wake"
            )
            wakeLock?.acquire(14 * 1000L) // Safe 14-sec window

            // 2. Resolve hardware Alarm Ringtone
            var soundUri: Uri? = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            if (soundUri == null) {
                soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            }
            if (soundUri == null) {
                soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            }

            // 3. Play looping audible sound at USAGE_ALARM stream
            if (soundUri != null) {
                try {
                    mediaPlayer = MediaPlayer().apply {
                        setAudioAttributes(
                            AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build()
                        )
                        setDataSource(applicationContext, soundUri)
                        isLooping = true
                        prepare()
                        start()
                    }
                } catch (_: Exception) {
                    ringtone = RingtoneManager.getRingtone(applicationContext, soundUri)?.apply {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            audioAttributes = AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build()
                        } else {
                            @Suppress("DEPRECATION")
                            streamType = AudioManager.STREAM_ALARM
                        }
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                            isLooping = true
                        }
                        play()
                    }
                }
            }

            // 4. Heavy repeating vibration
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            val pattern = longArrayOf(0, 800, 200, 800, 200, 800)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }

            // 5. Post Heads-Up Alert Notification with STOP RINGING Action
            showRingingHeadsUpNotification(
                "CLASS COMPLETED: $courseTitle",
                "The $courseTitle ($batchName) session has concluded. Please come and pick up your child safely."
            )

            // 6. Automatically silence after exactly 10 seconds
            alarmStopRunnable = Runnable {
                stopAlarmSound()
            }
            mainHandler.postDelayed(alarmStopRunnable!!, 10000L)

        } catch (e: Exception) {
            e.printStackTrace()
            stopAlarmSound()
        }
    }

    private fun showRingingHeadsUpNotification(title: String, message: String) {
        try {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val appIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingAppIntent = PendingIntent.getActivity(
                this, 0, appIntent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT else PendingIntent.FLAG_UPDATE_CURRENT
            )

            val stopIntent = Intent(this, AlarmStopReceiver::class.java)
            val pendingStopIntent = PendingIntent.getBroadcast(
                this, 1, stopIntent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT else PendingIntent.FLAG_UPDATE_CURRENT
            )

            val logo = try {
                BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
            } catch (_: Exception) { null }

            val builder = NotificationCompat.Builder(this, CHANNEL_CLASS_ALERTS)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setLargeIcon(logo)
                .setColor(0xFF800020.toInt())
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(pendingAppIntent)
                .setFullScreenIntent(pendingAppIntent, true)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "STOP RINGING", pendingStopIntent)

            nm.notify(NOTIF_ID_ALARM, builder.build())
        } catch (_: Exception) {}
    }

    private fun showAttendanceNotification(title: String, message: String, isPresent: Boolean) {
        try {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                this, 0, intent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT else PendingIntent.FLAG_UPDATE_CURRENT
            )

            val logo = try {
                BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
            } catch (_: Exception) { null }

            val builder = NotificationCompat.Builder(this, CHANNEL_ATTENDANCE)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setLargeIcon(logo)
                .setColor(if (isPresent) 0xFF059669.toInt() else 0xFFDC2626.toInt())
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)

            val notifId = (System.currentTimeMillis() % 10000).toInt() + 2000
            nm.notify(notifId, builder.build())
        } catch (_: Exception) {}
    }

    fun stopAlarmSound() {
        isAlarmRinging = false
        alarmStopRunnable?.let { mainHandler.removeCallbacks(it) }
        alarmStopRunnable = null

        try {
            mediaPlayer?.let {
                if (it.isPlaying) it.stop()
                it.release()
            }
            mediaPlayer = null

            ringtone?.let {
                if (it.isPlaying) it.stop()
            }
            ringtone = null

            vibrator?.cancel()
            vibrator = null

            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
            wakeLock = null

            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.cancel(NOTIF_ID_ALARM)
        } catch (_: Exception) {}
    }

    override fun onDestroy() {
        stopAlarmSound()
        stopMonitoring()
        instance = null
        super.onDestroy()
    }
}
