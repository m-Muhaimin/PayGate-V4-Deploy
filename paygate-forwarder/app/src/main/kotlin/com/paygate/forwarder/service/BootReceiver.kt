package com.paygate.forwarder.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.paygate.forwarder.config.DeviceConfig
import com.paygate.forwarder.worker.DispatchScheduler

/** Restores the keep-alive service and drains any queued SMS after a reboot or app update. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED &&
            intent.action != Intent.ACTION_MY_PACKAGE_REPLACED
        ) return
        if (!DeviceConfig.get(context).isEnrolled) return
        KeepAliveService.start(context)
        DispatchScheduler.kick(context)
    }
}
