package com.paygate.forwarder.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

/**
 * NOTE: no fallbackToDestructiveMigration(). This table holds undelivered payment evidence, so a
 * schema change must ship a real Migration rather than silently wiping the queue.
 */
@Database(entities = [PendingSms::class], version = 1, exportSchema = true)
abstract class ForwarderDatabase : RoomDatabase() {

    abstract fun pendingSmsDao(): PendingSmsDao

    companion object {
        @Volatile
        private var instance: ForwarderDatabase? = null

        fun get(context: Context): ForwarderDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    ForwarderDatabase::class.java,
                    "paygate_forwarder.db",
                ).build().also { instance = it }
            }
    }
}
