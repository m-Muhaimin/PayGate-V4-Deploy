package com.paygate.forwarder

import com.paygate.forwarder.sms.SenderFilter
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SenderFilterTest {
    private val allow = SenderFilter.DEFAULT_SENDERS

    @Test
    fun knownMfsSendersPassCaseInsensitively() {
        assertTrue(SenderFilter.isAllowed("bKash", allow))
        assertTrue(SenderFilter.isAllowed("NAGAD", allow))
        assertTrue(SenderFilter.isAllowed("  Rocket ", allow))
        assertTrue(SenderFilter.isAllowed("16216", allow))
        assertTrue(SenderFilter.isAllowed("CellFin", allow))
    }

    @Test
    fun personalAndUnknownSendersAreBlocked() {
        assertFalse(SenderFilter.isAllowed("01712345678", allow))
        assertFalse(SenderFilter.isAllowed("+8801712345678", allow))
        assertFalse(SenderFilter.isAllowed("Grameenphone", allow))
        assertFalse(SenderFilter.isAllowed("bkash-fake", allow))
        assertFalse(SenderFilter.isAllowed("", allow))
        assertFalse(SenderFilter.isAllowed(null, allow))
    }

    @Test
    fun parseNormalizesAndDeduplicates() {
        assertEquals(listOf("bkash", "16247", "mybank"), SenderFilter.parse(" bKash, 16247;MyBank\nbkash ,, "))
    }
}
