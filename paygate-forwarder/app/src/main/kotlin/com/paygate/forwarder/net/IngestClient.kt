package com.paygate.forwarder.net

import com.paygate.forwarder.config.DeviceConfig
import com.paygate.forwarder.crypto.DeviceSigner
import com.paygate.forwarder.data.PendingSms
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.time.Instant
import java.util.concurrent.TimeUnit

/**
 * Blocking HTTP client for the two signed device endpoints. Call from a background thread only
 * (the workers do, via SequencedSender).
 *
 * Redirects are NOT followed: an http->https redirect would silently turn the POST into a GET.
 * A misconfigured URL therefore surfaces as a retryable "HTTP 301" instead of lost SMS.
 */
class IngestClient(private val config: DeviceConfig) {

    private val http = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .followRedirects(false)
        .followSslRedirects(false)
        .build()

    private val jsonType = "application/json; charset=utf-8".toMediaType()

    fun postSms(sms: PendingSms, seqNo: Long, timestampSec: Long): IngestOutcome {
        val body = JSONObject()
            .put("sender", sms.sender)
            .put("raw_sms", sms.rawSms)
            .put("sim_slot", sms.simSlot)
            .put("client_msg_id", sms.clientMsgId)
            .put("received_at", Instant.ofEpochMilli(sms.receivedAtMs).toString()) // informational; not signed
        return send("/v1/sms/webhook", body, signedPayload = sms.rawSms, seqNo, timestampSec)
    }

    fun postHeartbeat(
        batteryPercent: Int,
        charging: Boolean,
        pendingCount: Int,
        seqNo: Long,
        timestampSec: Long,
    ): IngestOutcome {
        val body = JSONObject()
            .put("battery_level", batteryPercent)
            .put("is_charging", charging)
            .put("pending_count", pendingCount)
        val payload = HeartbeatPayload.canonical(batteryPercent, charging, pendingCount)
        return send("/v1/devices/heartbeat", body, payload, seqNo, timestampSec)
    }

    private fun send(
        path: String,
        body: JSONObject,
        signedPayload: String,
        seqNo: Long,
        timestampSec: Long,
    ): IngestOutcome {
        val secret = config.secret()
            ?: return IngestOutcome.AuthRejected(0, "Device secret unavailable - re-enter it in the app", false)
        val deviceId = config.deviceId
        val signature = DeviceSigner.sign(secret, deviceId, seqNo, timestampSec, signedPayload)

        val request = Request.Builder()
            .url(config.serverUrl + path)
            .header("X-Device-Id", deviceId)
            .header("X-Device-Seq", seqNo.toString())
            .header("X-Device-Timestamp", timestampSec.toString())
            .header("X-Device-Signature", signature)
            .post(body.toString().toRequestBody(jsonType))
            .build()

        return try {
            http.newCall(request).execute().use { response ->
                ResponseClassifier.classify(response.code, response.body?.string().orEmpty())
            }
        } catch (e: IOException) {
            IngestOutcome.Retryable("Network: ${e.message ?: e.javaClass.simpleName}")
        } catch (e: IllegalArgumentException) {
            // Malformed stored URL.
            IngestOutcome.Retryable("Invalid server URL: ${e.message}")
        }
    }
}
