package com.paygate.forwarder.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.paygate.forwarder.R
import com.paygate.forwarder.data.ForwarderDatabase
import com.paygate.forwarder.data.SmsStatus
import com.paygate.forwarder.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * Keeps the process alive on aggressive OEMs and shows queue depth. It does no networking: the SMS
 * broadcast receiver and WorkManager do the actual work.
 *
 * Uses the `specialUse` foreground type on purpose: `dataSync` is capped at ~6h per day on
 * Android 15 and would be killed. Sideloaded builds only; a Play Store release would need a
 * special-use declaration (and SMS permissions are heavily restricted there anyway).
 */
class KeepAliveService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var watcher: Job? = null

    override fun onCreate() {
        super.onCreate()
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.notif_channel_name),
            NotificationManager.IMPORTANCE_LOW,
        )
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            buildNotification(pending = 0),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
        )
        if (watcher == null) {
            watcher = scope.launch {
                ForwarderDatabase.get(this@KeepAliveService)
                    .pendingSmsDao()
                    .observeCount(SmsStatus.PENDING)
                    .collect { pending ->
                        getSystemService(NotificationManager::class.java)
                            .notify(NOTIFICATION_ID, buildNotification(pending))
                    }
            }
        }
        return START_STICKY
    }

    private fun buildNotification(pending: Int) =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_forwarder)
            .setContentTitle(getString(R.string.notif_title))
            .setContentText(if (pending == 0) "Queue empty" else "$pending SMS waiting to send")
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(
                PendingIntent.getActivity(
                    this,
                    0,
                    Intent(this, MainActivity::class.java),
                    PendingIntent.FLAG_IMMUTABLE,
                ),
            )
            .build()

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "PayGateKeepAlive"
        private const val CHANNEL_ID = "paygate_forwarder_status"
        private const val NOTIFICATION_ID = 101

        fun start(context: Context) {
            try {
                ContextCompat.startForegroundService(context, Intent(context, KeepAliveService::class.java))
            } catch (e: Exception) {
                // e.g. started from the background on Android 12+. SMS delivery still works without it.
                Log.w(TAG, "Could not start keep-alive service: ${e.message}")
            }
        }
    }
}
