package com.paygate.forwarder.config

import android.content.Context
import com.paygate.forwarder.BuildConfig
import com.paygate.forwarder.crypto.KeystoreVault
import com.paygate.forwarder.sms.SenderFilter
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

/**
 * Operator-provisioned configuration. Nothing is hardcoded: until the operator enrolls the
 * device (server URL, device ID, device secret) the app only queues SMS locally.
 */
class DeviceConfig private constructor(context: Context) {

    private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /** Anti-replay counter; every write is a synchronous commit so a crash can never reuse a number. */
    val sequence = SequenceCounter(
        load = { prefs.getLong(KEY_SEQ, 0L) },
        store = { prefs.edit().putLong(KEY_SEQ, it).commit() },
    )

    val serverUrl: String get() = prefs.getString(KEY_URL, "").orEmpty()
    val deviceId: String get() = prefs.getString(KEY_DEVICE_ID, "").orEmpty()

    fun secret(): String? = prefs.getString(KEY_SECRET, null)?.let { KeystoreVault.decrypt(it) }

    val isEnrolled: Boolean
        get() = serverUrl.isNotBlank() && deviceId.isNotBlank() && secret() != null

    var senderAllowlist: List<String>
        get() = prefs.getString(KEY_SENDERS, null)
            ?.let(SenderFilter::parse)
            ?.takeIf { it.isNotEmpty() }
            ?: SenderFilter.DEFAULT_SENDERS
        set(value) {
            prefs.edit().putString(KEY_SENDERS, value.joinToString(",")).apply()
        }

    /**
     * Validates and stores enrollment. Returns an error message, or null on success.
     * A blank [secret] keeps the previously stored secret.
     */
    fun enroll(rawUrl: String, rawDeviceId: String, secret: String?, sendersCsv: String): String? {
        val url = rawUrl.trim().removeSuffix("/")
        val parsed = url.toHttpUrlOrNull() ?: return "Server URL is not valid"
        if (parsed.scheme != "https" && !BuildConfig.DEBUG) return "Server URL must start with https://"

        val id = rawDeviceId.trim()
        if (!DEVICE_ID_REGEX.matches(id)) {
            return "Device ID must be 3-64 characters: letters, digits, '_', '-' or '.'"
        }

        val newSecret = secret?.trim().orEmpty()
        if (newSecret.isEmpty() && secret() == null) return "Device secret is required"

        val editor = prefs.edit().putString(KEY_URL, url).putString(KEY_DEVICE_ID, id)
        if (newSecret.isNotEmpty()) editor.putString(KEY_SECRET, KeystoreVault.encrypt(newSecret))
        editor.apply()

        senderAllowlist = SenderFilter.parse(sendersCsv).ifEmpty { SenderFilter.DEFAULT_SENDERS }
        clearStatus()
        return null
    }

    // ---- status shown in the UI ----

    val lastDeliveryAtMs: Long get() = prefs.getLong(KEY_LAST_OK, 0L)
    val lastError: String? get() = prefs.getString(KEY_LAST_ERR, null)
    val lastErrorAtMs: Long get() = prefs.getLong(KEY_LAST_ERR_AT, 0L)
    val clockDriftSuspected: Boolean get() = prefs.getBoolean(KEY_DRIFT, false)
    val heartbeatStatus: String? get() = prefs.getString(KEY_HB_STATUS, null)
    val heartbeatAtMs: Long get() = prefs.getLong(KEY_HB_AT, 0L)

    fun recordDelivered() {
        prefs.edit()
            .putLong(KEY_LAST_OK, System.currentTimeMillis())
            .putBoolean(KEY_DRIFT, false)
            .remove(KEY_LAST_ERR)
            .apply()
    }

    fun recordError(message: String, clockDrift: Boolean = false) {
        prefs.edit()
            .putString(KEY_LAST_ERR, message.take(300))
            .putLong(KEY_LAST_ERR_AT, System.currentTimeMillis())
            .putBoolean(KEY_DRIFT, clockDrift)
            .apply()
    }

    fun recordHeartbeat(status: String, clockDrift: Boolean = false) {
        prefs.edit()
            .putString(KEY_HB_STATUS, status.take(200))
            .putLong(KEY_HB_AT, System.currentTimeMillis())
            .apply()
        if (clockDrift) prefs.edit().putBoolean(KEY_DRIFT, true).apply()
    }

    private fun clearStatus() {
        prefs.edit().remove(KEY_LAST_ERR).remove(KEY_HB_STATUS).putBoolean(KEY_DRIFT, false).apply()
    }

    companion object {
        private const val PREFS = "paygate_forwarder_prefs"
        private const val KEY_URL = "server_url"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_SECRET = "device_secret_enc"
        private const val KEY_SENDERS = "sender_allowlist"
        private const val KEY_SEQ = "last_seq_no"
        private const val KEY_LAST_OK = "last_delivery_at"
        private const val KEY_LAST_ERR = "last_error"
        private const val KEY_LAST_ERR_AT = "last_error_at"
        private const val KEY_DRIFT = "clock_drift"
        private const val KEY_HB_STATUS = "heartbeat_status"
        private const val KEY_HB_AT = "heartbeat_at"
        private val DEVICE_ID_REGEX = Regex("^[A-Za-z0-9_.-]{3,64}$")

        @Volatile
        private var instance: DeviceConfig? = null

        fun get(context: Context): DeviceConfig =
            instance ?: synchronized(this) {
                instance ?: DeviceConfig(context.applicationContext).also { instance = it }
            }
    }
}
