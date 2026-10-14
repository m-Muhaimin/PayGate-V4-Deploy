package com.paygate.forwarder.ui

import android.Manifest
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.paygate.forwarder.config.DeviceConfig
import com.paygate.forwarder.data.ForwarderDatabase
import com.paygate.forwarder.data.SmsStatus
import com.paygate.forwarder.databinding.ActivityMainBinding
import com.paygate.forwarder.service.KeepAliveService
import com.paygate.forwarder.worker.DispatchScheduler
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.text.DateFormat
import java.util.Date

/** Single screen: enroll the device, grant permissions, and watch queue health. */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var config: DeviceConfig

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
            lifecycleScope.launch { refreshStatus() }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        config = DeviceConfig.get(this)

        binding.etServerUrl.setText(config.serverUrl)
        binding.etDeviceId.setText(config.deviceId)
        binding.etSenders.setText(config.senderAllowlist.joinToString(", "))
        if (config.secret() != null) {
            binding.tilDeviceSecret.helperText = "Stored in the Android Keystore. Leave blank to keep it."
        }

        binding.btnSave.setOnClickListener { saveEnrollment() }
        binding.btnPermissions.setOnClickListener { requestPermissions() }
        binding.btnBattery.setOnClickListener { openBatterySettings() }
        binding.btnRetry.setOnClickListener {
            DispatchScheduler.kick(this)
            DispatchScheduler.heartbeatNow(this)
            Toast.makeText(this, "Retry scheduled", Toast.LENGTH_SHORT).show()
        }

        if (config.isEnrolled) KeepAliveService.start(this)
        // First launch: ask for the SMS permission straight away.
        if (savedInstanceState == null && !granted(Manifest.permission.RECEIVE_SMS)) requestPermissions()
    }

    override fun onStart() {
        super.onStart()
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                while (isActive) {
                    refreshStatus()
                    delay(3_000)
                }
            }
        }
    }

    private fun saveEnrollment() {
        val error = config.enroll(
            rawUrl = binding.etServerUrl.text?.toString().orEmpty(),
            rawDeviceId = binding.etDeviceId.text?.toString().orEmpty(),
            secret = binding.etDeviceSecret.text?.toString(),
            sendersCsv = binding.etSenders.text?.toString().orEmpty(),
        )
        if (error != null) {
            Toast.makeText(this, error, Toast.LENGTH_LONG).show()
            return
        }
        binding.etDeviceSecret.setText("")
        binding.tilDeviceSecret.helperText = "Stored in the Android Keystore. Leave blank to keep it."
        KeepAliveService.start(this)
        DispatchScheduler.kick(this) // flush anything queued before enrollment
        DispatchScheduler.heartbeatNow(this)
        Toast.makeText(this, "Saved. Forwarding is active.", Toast.LENGTH_SHORT).show()
        lifecycleScope.launch { refreshStatus() }
    }

    private fun requestPermissions() {
        val wanted = mutableListOf(Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_PHONE_STATE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            wanted += Manifest.permission.POST_NOTIFICATIONS
        }
        val missing = wanted.filterNot { granted(it) }
        if (missing.isEmpty()) {
            Toast.makeText(this, "All permissions already granted", Toast.LENGTH_SHORT).show()
            return
        }
        permissionLauncher.launch(missing.toTypedArray())
    }

    private fun openBatterySettings() {
        try {
            startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, "Open Settings > Battery and exempt this app", Toast.LENGTH_LONG).show()
        }
    }

    private fun granted(permission: String) =
        ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED

    private suspend fun refreshStatus() {
        val dao = ForwarderDatabase.get(this).pendingSmsDao()
        val pending = dao.count(SmsStatus.PENDING)
        val rejected = dao.count(SmsStatus.REJECTED)

        val text = buildString {
            appendLine("Enrolled:        ${yesNo(config.isEnrolled)}")
            appendLine("SMS permission:  ${yesNo(granted(Manifest.permission.RECEIVE_SMS))}")
            appendLine("SIM-slot access: ${yesNo(granted(Manifest.permission.READ_PHONE_STATE))}")
            appendLine("Queued: $pending    Rejected: $rejected")
            appendLine("Last delivery:   ${formatTime(config.lastDeliveryAtMs)}")
            config.lastError?.let { appendLine("Last error (${formatTime(config.lastErrorAtMs)}): $it") }
            if (config.clockDriftSuspected) {
                appendLine("WARNING: this phone's clock differs from the server by more than 5 minutes.")
                appendLine("Turn on automatic date & time, or the server will refuse every request.")
            }
            appendLine("Heartbeat:       ${config.heartbeatStatus ?: "-"} (${formatTime(config.heartbeatAtMs)})")
            append("Request counter: ${config.sequence.current()}")
        }
        binding.tvStatus.text = text
    }

    private fun yesNo(value: Boolean) = if (value) "yes" else "NO"

    private fun formatTime(ms: Long) =
        if (ms == 0L) "never" else DateFormat.getDateTimeInstance().format(Date(ms))
}
