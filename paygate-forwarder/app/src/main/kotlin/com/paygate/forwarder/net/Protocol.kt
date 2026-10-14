package com.paygate.forwarder.net

/** Result of one signed request to the PayGate API. */
sealed class IngestOutcome {
    /** 2xx. `duplicate` = server had already ingested this TrxID (safe to treat as delivered). */
    data class Delivered(val duplicate: Boolean) : IngestOutcome()

    /** 400/422: the server will never accept this payload (e.g. unparseable SMS). Terminal for the message. */
    data class Rejected(val reason: String) : IngestOutcome()

    /** 403 anti-replay: our counter is behind the server's. Raise the floor and retry. */
    data class ReplayRejected(val serverLastSeq: Long?) : IngestOutcome()

    /** 401/403 for any other reason (bad secret, unknown device, clock drift). Never drop the message. */
    data class AuthRejected(val code: Int, val reason: String, val clockDrift: Boolean) : IngestOutcome()

    /** Network error, 5xx, 429, redirects, anything else: try again later. */
    data class Retryable(val reason: String) : IngestOutcome()
}

object ResponseClassifier {
    private val lastSeqRegex = Regex("""last recorded sequence (\d+)""")

    fun classify(code: Int, body: String): IngestOutcome = when {
        code in 200..299 -> IngestOutcome.Delivered(duplicate = body.contains("duplicate_ignored"))
        code == 401 || code == 403 -> classifyAuth(code, body)
        code == 400 || code == 422 -> IngestOutcome.Rejected("HTTP $code: ${snippet(body)}")
        else -> IngestOutcome.Retryable("HTTP $code")
    }

    private fun classifyAuth(code: Int, body: String): IngestOutcome = when {
        body.contains("Anti-replay", ignoreCase = true) ->
            IngestOutcome.ReplayRejected(lastSeqRegex.find(body)?.groupValues?.get(1)?.toLongOrNull())
        body.contains("Timestamp drift", ignoreCase = true) ->
            IngestOutcome.AuthRejected(code, "Clock drift: ${snippet(body)}", clockDrift = true)
        else -> IngestOutcome.AuthRejected(code, "HTTP $code: ${snippet(body)}", clockDrift = false)
    }

    private fun snippet(body: String): String = body.replace('\n', ' ').take(160)
}

/** Canonical string signed for heartbeats (the server rebuilds it from the JSON fields). */
object HeartbeatPayload {
    fun canonical(batteryPercent: Int, charging: Boolean, pendingCount: Int): String =
        "HEARTBEAT|battery=$batteryPercent|charging=${if (charging) 1 else 0}|pending=$pendingCount"
}
