Protocol regression check: runs the app's real `DeviceSigner`, `SequenceCounter` and `ReplayRecovery`
(plain JVM, no Android) against a running PayGate server on :3333 (9 checks: replay self-heal,
duplicate-safe retry, heartbeat, bad secret, clock drift, unparseable SMS, missing headers).
Needs `kotlinc` and the server with the heartbeat patch applied. Compile together with:
`app/src/main/kotlin/com/paygate/forwarder/{crypto/DeviceSigner,config/SequenceCounter,net/Protocol,net/ReplayRecovery}.kt`
