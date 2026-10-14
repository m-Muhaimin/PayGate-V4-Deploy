package com.paygate.forwarder.sms

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.telephony.SubscriptionManager

/**
 * Best-effort SIM slot (1 or 2) for an incoming SMS.
 *
 * 1. The subscription id extra + SubscriptionManager is authoritative (needs READ_PHONE_STATE).
 * 2. Otherwise OEM-specific extras are read as 0-based indices. The value 1 is genuinely
 *    ambiguous across vendors, so VERIFY ON YOUR HANDSET with a test SMS to each SIM.
 * 3. Falls back to slot 1.
 */
object SimSlotResolver {

    @SuppressLint("MissingPermission")
    fun resolve(context: Context, intent: Intent): Int {
        for (key in arrayOf("subscription", "android.telephony.extra.SUBSCRIPTION_INDEX")) {
            val subId = intent.getIntExtra(key, -1)
            if (subId < 0) continue
            try {
                val manager = context.getSystemService(SubscriptionManager::class.java)
                val info = manager?.getActiveSubscriptionInfo(subId)
                if (info != null) return info.simSlotIndex + 1
            } catch (e: SecurityException) {
                // READ_PHONE_STATE not granted: fall through to the OEM extras.
            }
        }
        for (key in arrayOf("slot", "simId", "sim_slot", "slot_id", "simSlot", "phone")) {
            if (!intent.hasExtra(key)) continue
            when (intent.getIntExtra(key, -1)) {
                0 -> return 1
                1, 2 -> return 2
            }
        }
        return 1
    }
}
