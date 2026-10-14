package com.paygate.forwarder.sms

/**
 * Only SMS from known mobile-financial-service sender IDs are queued and forwarded.
 * Everything else (personal messages, OTPs from other services) never leaves the handset.
 *
 * Defaults mirror the server's ALLOWED_MFS_SENDERS (src/utils/smsParser.ts). Matching is an
 * exact, case-insensitive comparison on the sender ID.
 */
object SenderFilter {

    val DEFAULT_SENDERS: List<String> = listOf(
        "bkash", "16247",
        "nagad", "16167",
        "rocket", "16216", "dbbl",
        "upay", "16268", "ucb",
        "cellfin", "ibbl", "16259",
    )

    fun normalize(value: String): String = value.trim().lowercase()

    /** Parses a comma / semicolon / newline separated list into normalized, de-duplicated IDs. */
    fun parse(csv: String): List<String> =
        csv.split(',', ';', '\n')
            .map(::normalize)
            .filter { it.isNotEmpty() }
            .distinct()

    fun isAllowed(sender: String?, allowlist: Collection<String>): Boolean {
        if (sender.isNullOrBlank()) return false
        val needle = normalize(sender)
        return allowlist.any { normalize(it) == needle }
    }
}
