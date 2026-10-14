package com.paygate.forwarder.net

import com.paygate.forwarder.config.SequenceCounter

/**
 * Sends one request with a freshly reserved sequence number + timestamp. If the server reports our
 * counter is behind its own (fresh install, restored backup, server reset), jump the counter above
 * the server's last accepted number and retry immediately, a bounded number of times.
 *
 * Pure JVM: the Android-specific parts (locking, threading) live in SequencedSender.
 */
object ReplayRecovery {
    const val MAX_RETRIES = 3

    fun run(
        sequence: SequenceCounter,
        nowSeconds: () -> Long,
        attempt: (seqNo: Long, timestampSec: Long) -> IngestOutcome,
    ): IngestOutcome {
        var outcome = attempt(sequence.reserve(), nowSeconds())
        var retries = 0
        while (outcome is IngestOutcome.ReplayRejected && retries < MAX_RETRIES) {
            outcome.serverLastSeq?.let { sequence.raiseFloor(it) }
            retries++
            outcome = attempt(sequence.reserve(), nowSeconds())
        }
        return outcome
    }
}
