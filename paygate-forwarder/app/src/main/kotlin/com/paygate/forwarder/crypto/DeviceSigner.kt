package com.paygate.forwarder.crypto

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * HMAC-SHA256 request signer. Must stay byte-for-byte compatible with the server's
 * `computeDeviceSignature` (packages/domain/src/device.ts):
 *
 *   HMAC_SHA256(secret, "<deviceId>:<seqNo>:<timestamp>:<payload>")  ->  lowercase hex
 *
 * Pure JVM (no Android imports) so it is covered by plain unit tests.
 */
object DeviceSigner {

    fun canonical(deviceId: String, seqNo: Long, timestamp: Long, payload: String): String =
        "$deviceId:$seqNo:$timestamp:$payload"

    fun sign(secret: String, deviceId: String, seqNo: Long, timestamp: Long, payload: String): String {
        require(secret.isNotEmpty()) { "Device secret must not be empty" }
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "HmacSHA256"))
        val digest = mac.doFinal(canonical(deviceId, seqNo, timestamp, payload).toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }
}
