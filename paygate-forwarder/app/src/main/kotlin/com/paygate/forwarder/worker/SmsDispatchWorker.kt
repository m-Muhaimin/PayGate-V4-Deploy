package com.paygate.forwarder.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.paygate.forwarder.config.DeviceConfig
import com.paygate.forwarder.data.ForwarderDatabase
import com.paygate.forwarder.net.IngestClient
import com.paygate.forwarder.net.IngestOutcome
import com.paygate.forwarder.net.SequencedSender
import java.util.concurrent.TimeUnit

/**
 * Drains the queue strictly in arrival order. Payment evidence is never dropped on a failure:
 *  - delivered / duplicate  -> mark delivered
 *  - 400 / 422              -> mark rejected (server can never accept it; kept for review)
 *  - auth / clock / network / 5xx -> stop, keep the message PENDING and let WorkManager retry
 *    (the queue head blocks the rest, which preserves ordering and surfaces the problem in the UI)
 */
class SmsDispatchWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val config = DeviceConfig.get(applicationContext)
        // Not enrolled yet: leave everything queued. Saving enrollment kicks the queue again.
        if (!config.isEnrolled) return Result.success()

        val dao = ForwarderDatabase.get(applicationContext).pendingSmsDao()
        val client = IngestClient(config)

        while (true) {
            val sms = dao.nextPending() ?: break

            when (val outcome = SequencedSender.send(config) { seq, ts -> client.postSms(sms, seq, ts) }) {
                is IngestOutcome.Delivered -> {
                    dao.markDelivered(sms.id)
                    config.recordDelivered()
                }
                is IngestOutcome.Rejected -> {
                    dao.markRejected(sms.id, outcome.reason)
                    config.recordError("SMS #${sms.id} rejected by server: ${outcome.reason}")
                }
                is IngestOutcome.ReplayRejected -> {
                    val reason = "Server keeps rejecting the request counter (server last=${outcome.serverLastSeq})"
                    dao.recordAttempt(sms.id, reason)
                    config.recordError(reason)
                    return Result.retry()
                }
                is IngestOutcome.AuthRejected -> {
                    dao.recordAttempt(sms.id, outcome.reason)
                    config.recordError(outcome.reason, clockDrift = outcome.clockDrift)
                    return Result.retry()
                }
                is IngestOutcome.Retryable -> {
                    dao.recordAttempt(sms.id, outcome.reason)
                    config.recordError(outcome.reason)
                    return Result.retry()
                }
            }
        }

        dao.pruneDelivered(System.currentTimeMillis() - TimeUnit.DAYS.toMillis(7))
        return Result.success()
    }
}
