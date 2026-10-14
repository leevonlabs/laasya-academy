package com.laasyaacademy.app

import android.app.job.JobParameters
import android.app.job.JobService
import android.content.Context
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.concurrent.Executors

/**
 * Standard Google Play & Android Battery-compliant JobService.
 * Does not require FOREGROUND_SERVICE or permanent notification.
 * Executes a brief check for class closure alerts when app is closed.
 */
class LaasyaBackgroundSyncJob : JobService() {
    private val executor = Executors.newSingleThreadExecutor()

    override fun onStartJob(params: JobParameters?): Boolean {
        executor.execute {
            try {
                checkAlertsOnce()
            } catch (_: Exception) {}
            jobFinished(params, false)
        }
        return true
    }

    override fun onStopJob(params: JobParameters?): Boolean {
        return false
    }

    private fun checkAlertsOnce() {
        val prefs = getSharedPreferences("laasya_monitoring", Context.MODE_PRIVATE)
        val studentId = prefs.getString("student_id", "") ?: ""
        val rollNumber = prefs.getString("roll_number", "") ?: ""
        val batchIds = prefs.getString("batch_ids", "all") ?: "all"

        if (studentId.isEmpty() && rollNumber.isEmpty()) return

        val encSId = URLEncoder.encode(studentId, "UTF-8")
        val encRoll = URLEncoder.encode(rollNumber, "UTF-8")
        val encBatch = URLEncoder.encode(batchIds, "UTF-8")

        val urlString = "https://laasya-academy.vercel.app/api/sessions/alerts?batchIds=$encBatch&studentId=$encSId&rollNumber=$encRoll&sinceSeconds=300"
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
                        for (i in 0 until alerts.length()) {
                            val alert = alerts.getJSONObject(i)
                            val id = alert.optString("id", "")
                            if (id.isEmpty()) continue

                            val procPrefs = getSharedPreferences("laasya_processed_alerts", Context.MODE_PRIVATE)
                            if (!procPrefs.getBoolean(id, false)) {
                                procPrefs.edit().putBoolean(id, true).apply()

                                val alertType = alert.optString("alert_type", "class_closed")
                                if (alertType == "class_closed") {
                                    val courseTitle = alert.optString("course_title", "Classical Dance")
                                    val batchName = alert.optString("batch_name", "Session")
                                    MainActivity.postClassCompletedNotification(
                                        this,
                                        "CLASS COMPLETED: $courseTitle",
                                        "The $courseTitle ($batchName) session has concluded. Please come and pick up your child safely."
                                    )
                                    break
                                }
                            }
                        }
                    }
                }
            }
        } catch (_: Exception) {
        } finally {
            connection?.disconnect()
        }
    }
}
