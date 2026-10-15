package com.laasyaacademy.app

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
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

        const val CHANNEL_CLASS_ALERTS = LaasyaApplication.CHANNEL_CLASS_ALERTS
        const val CHANNEL_ATTENDANCE = LaasyaApplication.CHANNEL_ATTENDANCE
        const val CHANNEL_NOTICES = LaasyaApplication.CHANNEL_NOTICES

        const val NOTIF_ID_ALARM = 1001
        const val NOTIF_ID_ATTENDANCE = 1002
        const val NOTIF_ID_NOTICE = 1003

        var activeInstance: MainActivity? = null

        fun stopActiveAlarm() {
            activeInstance?.stopAlarm()
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
        val alertType = newIntent.getStringExtra("alert_type")
        if ((route != null || alertType != null) && flutterEngine != null) {
            val payload = mutableMapOf<String, Any>()
            val extras = newIntent.extras
            if (extras != null) {
                for (key in extras.keySet()) {
                    extras.get(key)?.let { payload[key] = it.toString() }
                }
            }
            newIntent.removeExtra("route")
            newIntent.removeExtra("alert_type")
            MethodChannel(flutterEngine!!.dartExecutor.binaryMessenger, CHANNEL_NAME)
                .invokeMethod("onNotificationOpened", payload)
        }
    }

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        val filter = IntentFilter(ACTION_STOP_ALARM)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(stopAlarmReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(stopAlarmReceiver, filter)
        }

        requestNotificationPermission()

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL_NAME).setMethodCallHandler { call, result ->
            when (call.method) {
                "startAlarmRing" -> {
                    val durationSec = call.argument<Int>("duration") ?: 10
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
                "showNoticeNotification" -> {
                    val title = call.argument<String>("title") ?: "Academy Notice"
                    val message = call.argument<String>("message") ?: "New announcement published."

                    showNoticeNotification(title, message)
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
                "startBackgroundAlertService" -> {
                    result.success(true)
                }
                "stopBackgroundAlertService" -> {
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
                    val alertType = intent?.getStringExtra("alert_type")
                    val data = if (route != null || alertType != null) {
                        val map = mutableMapOf<String, Any>()
                        intent?.extras?.let { extras ->
                            for (key in extras.keySet()) {
                                extras.get(key)?.let { map[key] = it.toString() }
                            }
                        }
                        if (!map.containsKey("route") && route != null) {
                            map["route"] = route
                        }
                        map
                    } else null
                    intent?.removeExtra("route")
                    intent?.removeExtra("alert_type")
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

    private fun requestBatteryOptimization() {
        // Battery optimization exemption is not forced or repeatedly requested
    }

    private fun isIgnoringBatteryOptimizations(): Boolean {
        return true
    }

    private fun startAlarm(durationSec: Int, title: String, message: String) {
        stopAlarm()

        try {
            // 1. Wake screen
            val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
            wakeLock = powerManager?.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                "laasya:alarm_wake"
            )
            wakeLock?.acquire((durationSec + 2) * 1000L)

            // 2. Play alert sound (default notification tone or vocal chime) for 10 seconds using USAGE_ALARM
            try {
                val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                    ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)

                val audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()

                mediaPlayer = try {
                    MediaPlayer().apply {
                        setDataSource(applicationContext, soundUri)
                        setAudioAttributes(audioAttributes)
                        isLooping = true
                        prepare()
                        start()
                    }
                } catch (_: Exception) {
                    MediaPlayer.create(applicationContext, R.raw.class_completed, audioAttributes, 0)?.apply {
                        setVolume(1.0f, 1.0f)
                        isLooping = true
                        start()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // 3. Vibrate device with 10-second rhythmic pattern
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            val pattern = longArrayOf(0, 1000, 400, 1000, 400, 1000, 400, 1000, 400, 1000, 400, 1000, 400, 1000)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, -1)
            }

            // 4. Fire high-priority Heads-Up Notification with custom sound
            showClassAlertNotification(title, message)

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
        stopAlarm()
        try {
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
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

    private fun showClassAlertNotification(title: String, message: String) {
        val appIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("route", "/attendance")
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

        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

        val notif = NotificationCompat.Builder(this, CHANNEL_CLASS_ALERTS)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(logo)
            .setColor(0xFF8A064D.toInt())
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setSound(defaultSoundUri)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "DISMISS", stopPendingIntent)
            .build()

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIF_ID_ALARM, notif)
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

    private fun showNoticeNotification(title: String, message: String) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        ensureNotificationChannels(this)

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

        nm.notify(NOTIF_ID_NOTICE, notif)
    }

    private fun ensureNotificationChannels(context: Context) {
        LaasyaApplication.ensureNotificationChannels(context)
    }
}
