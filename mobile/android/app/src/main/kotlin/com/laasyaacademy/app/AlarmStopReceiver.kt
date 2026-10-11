package com.laasyaacademy.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AlarmStopReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        LaasyaAlertService.stopActiveAlarm()
    }
}
