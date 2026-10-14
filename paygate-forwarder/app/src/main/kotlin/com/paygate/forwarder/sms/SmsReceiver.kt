package com.paygate.forwarder.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.paygate.forwarder.config.DeviceConfig
import com.paygate.forwarder.data.ForwarderDatabase
import com.paygate.forwarder.data.PendingSms
import com.paygate.forwarder.worker.DispatchScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.util.UUID

/**
 * Receives incoming SMS, keeps only those from allow-listed MFS sender IDs, writes them to the
 * durable queue and kicks the dispatcher. Message bodies are never logged (they contain account
 * numbers and balances).
 */
class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        val sender = messages[0].displayOriginatingAddress ?: return
        val config = DeviceConfig.get(context)
        if (!SenderFilter.isAllowed(sender, config.senderAllowlist)) return

        val body = messages.joinToString("") { it.displayMessageBody.orEmpty() }
        if (body.isBlank()) return

        val sms = PendingSms(
            clientMsgId = UUID.randomUUID().toString(),
            sender = sender,
            rawSms = body,
            simSlot = SimSlotResolver.resolve(context, intent),
            receivedAtMs = messages[0].timestampMillis.takeIf { it > 0 } ?: System.currentTimeMillis(),
        )

        val pendingResult = goAsync()
        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
            try {
                ForwarderDatabase.get(context).pendingSmsDao().insert(sms)
                DispatchScheduler.kick(context)
                Log.i(TAG, "Queued SMS from $sender (${body.length} chars, SIM ${sms.simSlot})")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to queue SMS from $sender", e)
            } finally {
                pendingResult.finish()
            }
        }
    }

    private companion object {
        const val TAG = "PayGateSmsReceiver"
    }
}
