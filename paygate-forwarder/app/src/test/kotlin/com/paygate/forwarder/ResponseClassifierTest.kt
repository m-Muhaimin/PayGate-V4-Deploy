package com.paygate.forwarder

import com.paygate.forwarder.net.HeartbeatPayload
import com.paygate.forwarder.net.IngestOutcome
import com.paygate.forwarder.net.ResponseClassifier
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ResponseClassifierTest {

    @Test
    fun successIsDelivered() {
        assertEquals(IngestOutcome.Delivered(false), ResponseClassifier.classify(200, """{"received":true}"""))
    }

    @Test
    fun duplicateIsStillDelivered() {
        assertEquals(
            IngestOutcome.Delivered(true),
            ResponseClassifier.classify(200, """{"status":"duplicate_ignored"}"""),
        )
    }

    @Test
    fun replayIsParsedWithServerSequence() {
        val body = """{"error":"403 Forbidden: Device signature verification failed","details":"Anti-replay violation: Sequence number 5 is not greater than last recorded sequence 100."}"""
        assertEquals(IngestOutcome.ReplayRejected(100L), ResponseClassifier.classify(403, body))
    }

    @Test
    fun clockDriftIsFlagged() {
        val body = """{"details":"Timestamp drift exceeded: Packet timestamp differs by 900s (max 300s)."}"""
        val outcome = ResponseClassifier.classify(403, body)
        assertTrue(outcome is IngestOutcome.AuthRejected)
        assertTrue((outcome as IngestOutcome.AuthRejected).clockDrift)
    }

    @Test
    fun badSignatureIsAuthRejectedNotDropped() {
        val outcome = ResponseClassifier.classify(403, """{"details":"Cryptographic signature mismatch"}""")
        assertTrue(outcome is IngestOutcome.AuthRejected)
        assertFalse((outcome as IngestOutcome.AuthRejected).clockDrift)
    }

    @Test
    fun missingHeaders401IsAuthRejected() {
        assertTrue(ResponseClassifier.classify(401, "{}") is IngestOutcome.AuthRejected)
    }

    @Test
    fun unparseableSmsIsTerminal() {
        assertTrue(ResponseClassifier.classify(422, """{"error":"Unparseable SMS payload"}""") is IngestOutcome.Rejected)
        assertTrue(ResponseClassifier.classify(400, "{}") is IngestOutcome.Rejected)
    }

    @Test
    fun everythingElseRetries() {
        for (code in listOf(301, 302, 404, 408, 409, 429, 500, 502, 503)) {
            assertTrue("code $code", ResponseClassifier.classify(code, "") is IngestOutcome.Retryable)
        }
    }

    @Test
    fun heartbeatCanonicalString() {
        assertEquals("HEARTBEAT|battery=87|charging=1|pending=3", HeartbeatPayload.canonical(87, true, 3))
        assertEquals("HEARTBEAT|battery=5|charging=0|pending=0", HeartbeatPayload.canonical(5, false, 0))
    }
}
