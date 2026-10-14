package com.laasyaacademy.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null) return
        val action = intent?.action
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == "android.intent.action.QUICKBOOT_POWERON"
        ) {
            val prefs = context.getSharedPreferences("laasya_monitoring", Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean("is_active", false)
            if (isActive) {
                val serviceIntent = Intent(context, LaasyaAlertService::class.java).apply {
                    this.action = LaasyaAlertService.ACTION_START_MONITORING
                    putExtra("role", prefs.getString("role", "student"))
                    putExtra("student_id", prefs.getString("student_id", ""))
                    putExtra("roll_number", prefs.getString("roll_number", ""))
                    putExtra("name", prefs.getString("name", ""))
                    putExtra("phone", prefs.getString("phone", ""))
                    putExtra("batch_ids", prefs.getString("batch_ids", "all"))
                }
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(serviceIntent)
                    } else {
                        context.startService(serviceIntent)
                    }
                } catch (_: Exception) {}
            }
        }
    }
}
