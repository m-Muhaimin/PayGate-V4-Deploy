# PayGate Forwarder (Android)

Runs on the handset that holds your bKash / Nagad / Rocket / Upay / CellFin SIMs. It receives the
confirmation SMS, queues it durably, and forwards it to the PayGate API with an HMAC-signed request
so the gateway can match it to a customer's TrxID.

## What is and isn't verified

| | Status |
|---|---|
| Signing matches the server (`computeDeviceSignature`), incl. Bengali text + newlines | **Tested** against server-generated vectors |
| Sender filter, response classification, sequence counter, replay recovery | **Unit tested** (25 tests, run with a real Kotlin 2.0.21 compiler) |
| Full protocol against the real server: counter self-heal, duplicate-safe retry, heartbeat, bad secret, clock drift, unparseable SMS, unsigned request | **Tested end to end** (`tools/e2e-protocol-check`) |
| Gradle build, Room/WorkManager wiring, UI, manifest on a real device | **NOT built or run.** The authoring sandbox had no Android SDK or Google Maven access. Expect to fix small things on the first build. All XML is well-formed and every Kotlin file parses. |
| SIM-slot detection on your handset | **Verify manually** (see checklist) |

## Build

JDK 17+ and Android Studio (Ladybug or newer), or just:

```
./gradlew testDebugUnitTest      # unit tests
./gradlew assembleDebug          # app/build/outputs/apk/debug/app-debug.apk
```

Debug builds may talk to `http://10.0.2.2` / `localhost` (emulator -> host). Release builds are HTTPS only.

### Release build
Create a keystore and add a `signingConfigs` block + `signingConfig = signingConfigs.getByName("release")`
in `app/build.gradle.kts` (read passwords from `~/.gradle/gradle.properties`, never commit them), then
`./gradlew assembleRelease`. Sideload only: Play Store restricts SMS permissions.

## Provision a device

1. Create the device on the server and note its **device ID** and **secret**.
2. Install the APK, open the app, grant the permissions it asks for.
3. Enter server URL (https), device ID, secret, and (optionally) extra sender IDs. Tap **Save and start**.
   The secret is encrypted with a non-exportable Android Keystore key. It is never shown again.
4. Tap **Battery optimisation settings** and exempt the app. On Xiaomi/Oppo/Vivo/Huawei/Samsung also enable
   *Autostart* / *Allow background activity*, and lock the app in recents.
5. Send a test SMS from each SIM's MFS and confirm the status panel shows `Last delivery`.

## How it behaves

- **Only MFS senders are forwarded.** Default allow-list mirrors the server (`bkash`, `16247`, `nagad`, `16167`,
  `rocket`, `16216`, `dbbl`, `upay`, `16268`, `ucb`, `cellfin`, `ibbl`, `16259`). Everything else never leaves the phone.
  `READ_SMS` is not requested; SMS bodies are never logged.
- **Durable queue (Room).** Delivery is retried indefinitely; a payment SMS is never dropped on a network or auth error.
  Only HTTP 400/422 (server can never accept it) marks a message `REJECTED`, and it stays in the DB for review.
- **Signed at send time.** Each attempt takes a fresh sequence number and timestamp, so messages queued through a long
  outage are not rejected as stale. All requests share one counter behind a mutex, so ordering is strict.
- **Self-healing counter.** After a reinstall the server says "last recorded sequence N"; the app jumps above N and retries.
- **Safe retries.** If a response is lost after the server processed the SMS, the retry carries a new sequence number and the
  server de-duplicates it by TrxID (returns `duplicate_ignored`, treated as delivered).
- **Clock drift is surfaced.** The server allows +/-5 minutes; if the phone clock is off, the status panel says so.
- **Heartbeat** every ~15 min (battery, charging, queue depth); it also re-kicks a stuck queue.
- Keep-alive foreground service (`specialUse`, not `dataSync`, which Android 15 caps at ~6 h/day) restarts after boot.
- No cloud backup of the secret or queue; HTTPS only in release; redirects are not followed.

## Server prerequisites

1. **Heartbeat:** apply `server-patch/heartbeat-device-signed.md`. Without it the heartbeat is rejected (shown in the UI);
   SMS forwarding is unaffected.
2. **Payment-state bug:** on the current server, `awaiting_payment -> paid` is an illegal transition, which crashes the process
   when an SMS arrives before the customer submits the TrxID (or the SMS reference matches first). The app cannot work around
   this. Fix `transitions.ts` before relying on this in production.

## Known limitations / next steps

- The local DB is not encrypted beyond Android's file-based encryption (SMS bodies contain balances). Consider SQLCipher.
- Work is not marked expedited; timeliness relies on the keep-alive service and battery exemption.
- No in-app list of `REJECTED` messages yet (they are kept in the DB and counted in the status panel).
- Enrollment is manual; a QR/provisioning-link flow would remove copy-paste of secrets.
- The sim-slot fallback (OEM extras) is a heuristic; the subscription-id path is authoritative.

## Layout

```
app/src/main/kotlin/com/paygate/forwarder/
  crypto/   DeviceSigner (HMAC, pure JVM), KeystoreVault (AES-GCM in Android Keystore)
  config/   DeviceConfig (enrollment + status), SequenceCounter (pure JVM)
  data/     Room queue: PendingSms, PendingSmsDao, ForwarderDatabase
  net/      IngestClient (OkHttp), SequencedSender, ReplayRecovery + Protocol (pure JVM)
  sms/      SmsReceiver, SenderFilter (pure JVM), SimSlotResolver
  worker/   DispatchScheduler, SmsDispatchWorker, HeartbeatWorker
  service/  KeepAliveService, BootReceiver
  ui/       MainActivity (enroll, permissions, status)
app/src/test/   unit tests (JUnit 4)
server-patch/   device-signed heartbeat route for server.ts
tools/e2e-protocol-check/   protocol regression check against a running server
```
