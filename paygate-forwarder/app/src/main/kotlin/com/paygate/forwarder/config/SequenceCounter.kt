package com.paygate.forwarder.config

/**
 * Persistent, strictly increasing request counter used for the server's anti-replay check
 * (the server rejects any `x-device-seq` <= the last one it accepted for this device).
 *
 * A fresh number is reserved for EVERY attempt, including retries. That keeps the counter
 * monotonic even when a response is lost after the server already processed the request
 * (the retry simply carries a higher number; the server de-duplicates the SMS by TrxID).
 *
 * `load` / `store` are injected so the logic is unit-testable; the app backs them with
 * SharedPreferences using a synchronous commit.
 */
class SequenceCounter(
    private val load: () -> Long,
    private val store: (Long) -> Unit,
) {
    @Synchronized
    fun reserve(): Long {
        val next = load() + 1
        store(next)
        return next
    }

    /** Self-heal after reinstall / server reset: jump above the server's last accepted number. */
    @Synchronized
    fun raiseFloor(serverLastSeq: Long) {
        if (serverLastSeq > load()) store(serverLastSeq)
    }

    @Synchronized
    fun current(): Long = load()
}
