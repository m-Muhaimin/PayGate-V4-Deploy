package com.paygate.forwarder

import com.paygate.forwarder.config.SequenceCounter
import com.paygate.forwarder.net.IngestOutcome
import com.paygate.forwarder.net.ReplayRecovery
import org.junit.Assert.assertEquals
import org.junit.Test

class ReplayRecoveryTest {
    private fun counter(start: Long = 0): SequenceCounter {
        var value = start
        return SequenceCounter({ value }, { value = it })
    }

    @Test
    fun freshInstallHealsAgainstServerCounter() {
        val c = counter(0)
        val seen = mutableListOf<Long>()
        val outcome = ReplayRecovery.run(c, { 1_700_000_000 }) { seq, _ ->
            seen += seq
            if (seq <= 100) IngestOutcome.ReplayRejected(100) else IngestOutcome.Delivered(false)
        }
        assertEquals(IngestOutcome.Delivered(false), outcome)
        assertEquals(listOf(1L, 101L), seen)
        assertEquals(101L, c.current())
    }

    @Test
    fun unparseableReplayIsBoundedNotInfinite() {
        val c = counter(0)
        var calls = 0
        val outcome = ReplayRecovery.run(c, { 1 }) { _, _ ->
            calls++
            IngestOutcome.ReplayRejected(null)
        }
        assertEquals(IngestOutcome.ReplayRejected(null), outcome)
        assertEquals(1 + ReplayRecovery.MAX_RETRIES, calls)
    }

    @Test
    fun nonReplayOutcomesAreNotRetried() {
        for (result in listOf(
            IngestOutcome.Delivered(true),
            IngestOutcome.Rejected("x"),
            IngestOutcome.AuthRejected(403, "bad", false),
            IngestOutcome.Retryable("net"),
        )) {
            var calls = 0
            val outcome = ReplayRecovery.run(counter(), { 1 }) { _, _ -> calls++; result }
            assertEquals(result, outcome)
            assertEquals(1, calls)
        }
    }

    @Test
    fun everyAttemptGetsAFreshTimestampAndHigherSequence() {
        val c = counter(10)
        var now = 1_000L
        val pairs = mutableListOf<Pair<Long, Long>>()
        ReplayRecovery.run(c, { now++ }) { seq, ts ->
            pairs += seq to ts
            if (pairs.size < 3) IngestOutcome.ReplayRejected(null) else IngestOutcome.Delivered(false)
        }
        assertEquals(listOf(11L to 1000L, 12L to 1001L, 13L to 1002L), pairs)
    }
}
