package com.paygate.forwarder.worker

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

object DispatchScheduler {
    private const val DISPATCH_WORK = "paygate_sms_dispatch"
    private const val HEARTBEAT_PERIODIC = "paygate_heartbeat_periodic"
    private const val HEARTBEAT_NOW = "paygate_heartbeat_now"

    private val needsNetwork = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    /**
     * Drain the queue. APPEND_OR_REPLACE chains behind a running/retrying run so FIFO order is
     * preserved and a new SMS can never be missed by a worker that is just finishing.
     * Linear backoff (30s, 60s, 90s ...) keeps retries prompt for payments.
     */
    fun kick(context: Context) {
        val request = OneTimeWorkRequestBuilder<SmsDispatchWorker>()
            .setConstraints(needsNetwork)
            .setBackoffCriteria(BackoffPolicy.LINEAR, 30, TimeUnit.SECONDS)
            .build()
        WorkManager.getInstance(context)
            .enqueueUniqueWork(DISPATCH_WORK, ExistingWorkPolicy.APPEND_OR_REPLACE, request)
    }

    fun scheduleHeartbeat(context: Context) {
        val request = PeriodicWorkRequestBuilder<HeartbeatWorker>(15, TimeUnit.MINUTES)
            .setConstraints(needsNetwork)
            .build()
        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(HEARTBEAT_PERIODIC, ExistingPeriodicWorkPolicy.KEEP, request)
    }

    fun heartbeatNow(context: Context) {
        val request = OneTimeWorkRequestBuilder<HeartbeatWorker>()
            .setConstraints(needsNetwork)
            .build()
        WorkManager.getInstance(context)
            .enqueueUniqueWork(HEARTBEAT_NOW, ExistingWorkPolicy.REPLACE, request)
    }
}
