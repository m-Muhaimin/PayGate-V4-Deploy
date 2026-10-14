package com.paygate.forwarder.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface PendingSmsDao {

    /** Returns -1 if a row with the same clientMsgId already exists. */
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(sms: PendingSms): Long

    @Query("SELECT * FROM pending_sms WHERE status = 'PENDING' ORDER BY id ASC LIMIT 1")
    suspend fun nextPending(): PendingSms?

    @Query("SELECT COUNT(*) FROM pending_sms WHERE status = :status")
    suspend fun count(status: String): Int

    @Query("SELECT COUNT(*) FROM pending_sms WHERE status = :status")
    fun observeCount(status: String): Flow<Int>

    @Query("UPDATE pending_sms SET status = 'DELIVERED', lastError = NULL WHERE id = :id")
    suspend fun markDelivered(id: Long)

    @Query("UPDATE pending_sms SET status = 'REJECTED', lastError = :reason WHERE id = :id")
    suspend fun markRejected(id: Long, reason: String)

    @Query("UPDATE pending_sms SET attempts = attempts + 1, lastError = :error WHERE id = :id")
    suspend fun recordAttempt(id: Long, error: String)

    @Query("DELETE FROM pending_sms WHERE status = 'DELIVERED' AND createdAtMs < :beforeMs")
    suspend fun pruneDelivered(beforeMs: Long)
}
