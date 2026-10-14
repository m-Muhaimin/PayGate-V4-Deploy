package com.paygate.forwarder

import android.app.Application
import com.paygate.forwarder.worker.DispatchScheduler

class PayGateApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Idempotent (KEEP policy). Also acts as the 15-minute safety net that re-kicks a stuck queue.
        DispatchScheduler.scheduleHeartbeat(this)
    }
}
