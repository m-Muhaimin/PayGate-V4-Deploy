package com.paygate.forwarder.worker

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.paygate.forwarder.config.DeviceConfig
import com.paygate.forwarder.data.ForwarderDatabase
import com.paygate.forwarder.data.SmsStatus
import com.paygate.forwarder.net.IngestClient
import com.paygate.forwarder.net.IngestOutcome
import com.paygate.forwarder.net.SequencedSender

/**
 * Signed device heartbeat every ~15 minutes (battery, charging, queue depth). It also re-kicks the
 * dispatcher when messages are waiting, so a stuck queue self-heals without user action.
 *
 * Needs the server's device-signed heartbeat endpoint (see server-patch/). Against a server that
 * still requires an admin token the heartbeat is rejected; that is reported in the UI and never
 * affects SMS delivery.
 */
class HeartbeatWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val config = DeviceConfig.get(applicationContext)
        if (!config.isEnrolled) return Result.success()

        val pending = ForwarderDatabase.get(applicationContext).pendingSmsDao().count(SmsStatus.PENDING)
        val (battery, charging) = readBattery()
        val client = IngestClient(config)

        val outcome = SequencedSender.send(config) { seq, ts ->
            client.postHeartbeat(battery, charging, pending, seq, ts)
        }

        when (outcome) {
            is IngestOutcome.Delivered -> config.recordHeartbeat("OK")
            is IngestOutcome.AuthRejected ->
                config.recordHeartbeat("Rejected: ${outcome.reason}", clockDrift = outcome.clockDrift)
            is IngestOutcome.Rejected -> config.recordHeartbeat("Rejected: ${outcome.reason}")
            is IngestOutcome.ReplayRejected -> config.recordHeartbeat("Counter rejected by server")
            is IngestOutcome.Retryable -> config.recordHeartbeat("Unreachable: ${outcome.reason}")
        }

        if (pending > 0) DispatchScheduler.kick(applicationContext)
        return Result.success()
    }

    private fun readBattery(): Pair<Int, Boolean> {
        val intent = applicationContext.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = intent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val percent = if (level >= 0 && scale > 0) (level * 100) / scale else 0
        val status = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val charging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
            status == BatteryManager.BATTERY_STATUS_FULL
        return percent to charging
    }
}
