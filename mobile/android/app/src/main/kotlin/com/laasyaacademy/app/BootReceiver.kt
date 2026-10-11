package com.laasyaacademy.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null) return
        val prefs = context.getSharedPreferences("laasya_monitoring", Context.MODE_PRIVATE)
        val isActive = prefs.getBoolean("is_active", false)
        if (isActive) {
            val serviceIntent = Intent(context, LaasyaAlertService::class.java).apply {
                action = LaasyaAlertService.ACTION_START_MONITORING
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        }
    }
}
