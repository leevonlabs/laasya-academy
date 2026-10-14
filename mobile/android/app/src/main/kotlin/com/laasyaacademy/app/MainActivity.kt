package com.laasyaacademy.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.job.JobInfo
import android.app.job.JobScheduler
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.annotation.NonNull
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    companion object {
        const val CHANNEL_NAME = "com.laasyaacademy.app/alarm"
        const val ACTION_STOP_ALARM = "com.laasyaacademy.app.ACTION_STOP_ALARM"

        const val CHANNEL_CLASS_ALERTS = "laasya_class_completed_chime_v2"
        const val CHANNEL_ATTENDANCE = "laasya_attendance_channel_v2"

        const val NOTIF_ID_ALARM = 1001
        const val NOTIF_ID_ATTENDANCE = 1002
        const val JOB_ID_SYNC = 8801

        var activeInstance: MainActivity? = null

        fun stopActiveAlarm() {
            activeInstance?.stopAlarm()
        }

        fun postClassCompletedNotification(context: Context, title: String, message: String) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            ensureNotificationChannels(context)

            val appIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("route", "/attendance")
            }
            val pendingIntent = PendingIntent.getActivity(
                context, 0, appIntent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
            )

            val stopIntent = Intent(context, AlarmStopReceiver::class.java)
            val stopPendingIntent = PendingIntent.getBroadcast(
                context, 1, stopIntent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
            )

            val logo = try {
                BitmapFactory.decodeResource(context.resources, R.mipmap.ic_launcher)
            } catch (_: Exception) { null }

            val soundUri = Uri.parse("android.resource://${context.packageName}/raw/class_completed")

            val notif = NotificationCompat.Builder(context, CHANNEL_CLASS_ALERTS)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setLargeIcon(logo)
                .setColor(0xFF8A064D.toInt())
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setSound(soundUri)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "DISMISS", stopPendingIntent)
                .build()

            nm.notify(NOTIF_ID_ALARM, notif)
        }

        fun ensureNotificationChannels(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

                val soundUri = Uri.parse("android.resource://${context.packageName}/raw/class_completed")
                val audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()

                // 1. Channel for Class Completed with custom child pickup chime
                val alertChannel = NotificationChannel(
                    CHANNEL_CLASS_ALERTS,
                    "Class Conclusion & Pickup Chimes",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Plays custom vocal chime ('Class is over') when class concludes for child pickup"
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 500)
                    setSound(soundUri, audioAttributes)
                    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                }
                nm.createNotificationChannel(alertChannel)

                // 2. Channel for Live Attendance
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
    }

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private val handler = Handler(Looper.getMainLooper())
    private var stopRunnable: Runnable? = null

    private val stopAlarmReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == ACTION_STOP_ALARM) {
                stopAlarm()
            }
        }
    }

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        activeInstance = this
        ensureNotificationChannels(this)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }
    }

    override fun onDestroy() {
        stopAlarm()
        if (activeInstance == this) activeInstance = null
        try {
            unregisterReceiver(stopAlarmReceiver)
        } catch (_: Exception) {}
        super.onDestroy()
    }

    override fun onNewIntent(newIntent: Intent) {
        super.onNewIntent(newIntent)
        setIntent(newIntent)
        val route = newIntent.getStringExtra("route")
        if (route != null && flutterEngine != null) {
            val payload = mapOf(
                "route" to route,
                "title" to (newIntent.getStringExtra("title") ?: ""),
                "message" to (newIntent.getStringExtra("message") ?: "")
            )
            newIntent.removeExtra("route")
            MethodChannel(flutterEngine!!.dartExecutor.binaryMessenger, CHANNEL_NAME)
                .invokeMethod("onNotificationOpened", payload)
        }
    }

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // Register Stop Alarm Broadcast Receiver
        val filter = IntentFilter(ACTION_STOP_ALARM)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(stopAlarmReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(stopAlarmReceiver, filter)
        }

        // Auto-request notification permissions on Android 13+
        requestNotificationPermission()

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL_NAME).setMethodCallHandler { call, result ->
            when (call.method) {
                "startAlarmRing" -> {
                    val durationSec = call.argument<Int>("duration") ?: 11
                    val title = call.argument<String>("title") ?: "CLASS COMPLETED!"
                    val message = call.argument<String>("message") ?: "Class has concluded. Please take your child back."

                    startAlarm(durationSec, title, message)
                    result.success(true)
                }
                "playClassCompletedSound" -> {
                    playClassCompletedAudioOnce()
                    result.success(true)
                }
                "stopAlarmRing" -> {
                    stopAlarm()
                    result.success(true)
                }
                "showAttendanceNotification" -> {
                    val title = call.argument<String>("title") ?: "Attendance Update"
                    val message = call.argument<String>("message") ?: "Attendance marked."
                    val isPresent = call.argument<Boolean>("isPresent") ?: true

                    showAttendanceNotification(title, message, isPresent)
                    result.success(true)
                }
                "requestNotificationPermission" -> {
                    requestNotificationPermission()
                    result.success(true)
                }
                "requestAllPermissions" -> {
                    requestAllPermissions()
                    result.success(true)
                }
                "requestBatteryOptimization" -> {
                    result.success(true)
                }
                "isIgnoringBatteryOptimizations" -> {
                    result.success(true)
                }
                "saveStudentAlertConfig" -> {
                    val studentId = call.argument<String>("student_id") ?: ""
                    val rollNumber = call.argument<String>("roll_number") ?: ""
                    val batchIds = call.argument<String>("batch_ids") ?: "all"

                    saveStudentConfigAndScheduleJob(studentId, rollNumber, batchIds)
                    result.success(true)
                }
                "scheduleBackgroundAlertCheck" -> {
                    schedulePeriodicBackgroundJob()
                    result.success(true)
                }
                "startBackgroundAlertService" -> {
                    val studentId = call.argument<String>("student_id") ?: ""
                    val rollNumber = call.argument<String>("roll_number") ?: ""
                    val batchIds = call.argument<String>("batch_ids") ?: "all"

                    saveStudentConfigAndScheduleJob(studentId, rollNumber, batchIds)
                    result.success(true)
                }
                "stopBackgroundAlertService" -> {
                    cancelPeriodicBackgroundJob()
                    result.success(true)
                }
                "markAlertProcessed" -> {
                    val alertId = call.argument<String>("alert_id") ?: ""
                    if (alertId.isNotEmpty()) {
                        val prefs = getSharedPreferences("laasya_processed_alerts", Context.MODE_PRIVATE)
                        prefs.edit().putBoolean(alertId, true).apply()
                    }
                    result.success(true)
                }
                "isAlertProcessed" -> {
                    val alertId = call.argument<String>("alert_id") ?: ""
                    val prefs = getSharedPreferences("laasya_processed_alerts", Context.MODE_PRIVATE)
                    result.success(prefs.getBoolean(alertId, false))
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
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }
    }

    private fun requestAllPermissions() {
        val permissionsToRequest = mutableListOf<String>()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.CAMERA)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.READ_MEDIA_IMAGES)
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsToRequest.toTypedArray(), 102)
        }
    }

    private fun startAlarm(durationSec: Int, title: String, message: String) {
        stopAlarm()

        try {
            // 1. Wake screen briefly
            val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
            wakeLock = powerManager?.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                "laasya:alarm_wake"
            )
            wakeLock?.acquire((durationSec + 2) * 1000L)

            // 2. Play custom vocal chime sound (R.raw.class_completed)
            val soundUri = Uri.parse("android.resource://${packageName}/raw/class_completed")
            try {
                mediaPlayer = MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    setDataSource(applicationContext, soundUri)
                    isLooping = false
                    prepare()
                    start()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // 3. Vibrate device with rhythmic cadence
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator
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

            // 4. Fire high-priority Heads-Up Notification
            postClassCompletedNotification(this, title, message)

            // 5. Automatically stop alarm after duration
            stopRunnable = Runnable {
                stopAlarm()
            }
            handler.postDelayed(stopRunnable!!, durationSec * 1000L)

        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun playClassCompletedAudioOnce() {
        try {
            mediaPlayer?.let {
                if (it.isPlaying) it.stop()
                it.release()
            }
            val soundUri = Uri.parse("android.resource://${packageName}/raw/class_completed")
            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                setDataSource(applicationContext, soundUri)
                isLooping = false
                prepare()
                start()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun stopAlarm() {
        try {
            stopRunnable?.let { handler.removeCallbacks(it) }
            stopRunnable = null

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

            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.cancel(NOTIF_ID_ALARM)
        } catch (_: Exception) {}
    }

    private fun showAttendanceNotification(title: String, message: String, isPresent: Boolean) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        ensureNotificationChannels(this)

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

        nm.notify(NOTIF_ID_ATTENDANCE, notif)
    }

    private fun saveStudentConfigAndScheduleJob(studentId: String, rollNumber: String, batchIds: String) {
        val prefs = getSharedPreferences("laasya_monitoring", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("student_id", studentId)
            .putString("roll_number", rollNumber)
            .putString("batch_ids", batchIds)
            .putBoolean("is_active", true)
            .apply()

        schedulePeriodicBackgroundJob()
    }

    private fun schedulePeriodicBackgroundJob() {
        try {
            val jobScheduler = getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler
            val componentName = ComponentName(this, LaasyaBackgroundSyncJob::class.java)
            val jobInfo = JobInfo.Builder(JOB_ID_SYNC, componentName)
                .setPeriodic(15 * 60 * 1000) // Standard 15-min periodic check
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .setPersisted(true)
                .build()
            jobScheduler.schedule(jobInfo)
        } catch (_: Exception) {}
    }

    private fun cancelPeriodicBackgroundJob() {
        try {
            val jobScheduler = getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler
            jobScheduler.cancel(JOB_ID_SYNC)
            val prefs = getSharedPreferences("laasya_monitoring", Context.MODE_PRIVATE)
            prefs.edit().clear().apply()
        } catch (_: Exception) {}
    }
}
