package com.paygate.forwarder.net

import com.paygate.forwarder.config.DeviceConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

/**
 * Serialises every signed request in the process (SMS dispatch AND heartbeat share one counter)
 * and signs at send time with a fresh sequence number and timestamp, so a message that sat in the
 * queue for hours is never rejected for an old timestamp. See ReplayRecovery for counter healing.
 */
object SequencedSender {
    private val mutex = Mutex()

    suspend fun send(
        config: DeviceConfig,
        attempt: (seqNo: Long, timestampSec: Long) -> IngestOutcome,
    ): IngestOutcome = withContext(Dispatchers.IO) {
        mutex.withLock {
            ReplayRecovery.run(config.sequence, { System.currentTimeMillis() / 1000 }, attempt)
        }
    }
}
