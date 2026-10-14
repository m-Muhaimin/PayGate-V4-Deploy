package com.paygate.forwarder.data

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

object SmsStatus {
    const val PENDING = "PENDING"     // waiting to be delivered (retried until it succeeds)
    const val DELIVERED = "DELIVERED" // server accepted it (or already had it)
    const val REJECTED = "REJECTED"   // server will never accept it (unparseable); kept for review
}

/**
 * An MFS confirmation SMS waiting in the durable local queue. Payment evidence is never
 * auto-deleted while PENDING: delivery is retried indefinitely.
 */
@Entity(
    tableName = "pending_sms",
    indices = [Index(value = ["clientMsgId"], unique = true), Index(value = ["status", "id"])],
)
data class PendingSms(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val clientMsgId: String,
    val sender: String,
    val rawSms: String,
    val simSlot: Int,
    val receivedAtMs: Long,
    val attempts: Int = 0,
    val status: String = SmsStatus.PENDING,
    val lastError: String? = null,
    val createdAtMs: Long = System.currentTimeMillis(),
)
