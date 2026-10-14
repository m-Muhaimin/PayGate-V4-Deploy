package com.paygate.forwarder

import com.paygate.forwarder.config.SequenceCounter
import org.junit.Assert.assertEquals
import org.junit.Test

class SequenceCounterTest {
    private fun counter(start: Long = 0): Pair<SequenceCounter, () -> Long> {
        var value = start
        return SequenceCounter({ value }, { value = it }) to { value }
    }

    @Test
    fun reserveIsStrictlyIncreasing() {
        val (c, _) = counter()
        assertEquals(listOf(1L, 2L, 3L), listOf(c.reserve(), c.reserve(), c.reserve()))
    }

    @Test
    fun persistsEveryReservation() {
        val (c, read) = counter(41)
        c.reserve()
        assertEquals(42L, read())
    }

    @Test
    fun raiseFloorOnlyMovesForward() {
        val (c, _) = counter(500)
        c.raiseFloor(100)
        assertEquals(500L, c.current())
        c.raiseFloor(900)
        assertEquals(900L, c.current())
    }

    @Test
    fun freshDeviceRecoversFromServerSequence() {
        // New install starts at 0; server last accepted 100 -> next request must be 101.
        val (c, _) = counter()
        assertEquals(1L, c.reserve())
        c.raiseFloor(100)
        assertEquals(101L, c.reserve())
    }
}
