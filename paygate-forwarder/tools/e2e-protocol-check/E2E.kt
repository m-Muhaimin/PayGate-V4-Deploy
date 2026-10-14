import com.paygate.forwarder.config.SequenceCounter
import com.paygate.forwarder.crypto.DeviceSigner
import com.paygate.forwarder.net.*
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

val base = "http://localhost:3333"
val http: HttpClient = HttpClient.newHttpClient()
fun esc(s: String) = "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n") + "\""

fun post(path: String, json: String, headers: Map<String, String>): Pair<Int, String> {
    val b = HttpRequest.newBuilder(URI("$base$path")).header("content-type", "application/json")
    headers.forEach { (k, v) -> b.header(k, v) }
    val r = http.send(b.POST(HttpRequest.BodyPublishers.ofString(json)).build(), HttpResponse.BodyHandlers.ofString())
    return r.statusCode() to r.body()
}
fun get(path: String, headers: Map<String, String> = emptyMap()): String {
    val b = HttpRequest.newBuilder(URI("$base$path")); headers.forEach { (k, v) -> b.header(k, v) }
    return http.send(b.GET().build(), HttpResponse.BodyHandlers.ofString()).body()
}

// same wire format as IngestClient.send(), minus Android/OkHttp
fun send(secret: String, deviceId: String, path: String, json: String, payload: String, seq: Long, ts: Long): IngestOutcome {
    val sig = DeviceSigner.sign(secret, deviceId, seq, ts, payload)
    val (code, body) = post(path, json, mapOf("X-Device-Id" to deviceId, "X-Device-Seq" to "$seq", "X-Device-Timestamp" to "$ts", "X-Device-Signature" to sig))
    return ResponseClassifier.classify(code, body)
}

fun check(name: String, ok: Boolean, detail: Any?) { println((if (ok) "PASS " else "FAIL ") + name + "  -> " + detail); if (!ok) failures++ }
var failures = 0

fun main() {
    val secret = "dev_sec_superadmin_9921"; val dev = "dev_superadmin_01"
    val key = mapOf("Authorization" to "Bearer sk_live_pg_99210a48b3c109df291c")
    val counter = SequenceCounter({ stored }, { stored = it })   // fresh install: starts at 0, server is at 100
    val now = { System.currentTimeMillis() / 1000 }

    val created = post("/v1/payments", """{"plan_id":"plan_pro_monthly","provider":"bkash"}""", key).second
    val id = Regex(""""id":"([^"]+)"""").find(created)!!.groupValues[1]
    val ref = Regex(""""reference":"([^"]+)"""").find(created)!!.groupValues[1]
    // customer claims TrxID first (the order the current server handles correctly)
    post("/v1/pay/$id/confirm", """{"trx_id":"AB12CD34EF"}""", emptyMap())

    val sms = "You have received Tk 1,200.00 from 01712750278. Fee Tk 0.00. Balance Tk 14,500.00. TrxID AB12CD34EF and Ref $ref at 13/10/2026 15:24."
    val smsJson = """{"sender":"bKash","raw_sms":${esc(sms)},"sim_slot":1,"client_msg_id":"e2e-1"}"""

    val seen = mutableListOf<Long>()
    val first = ReplayRecovery.run(counter, now) { seq, ts -> seen += seq; send(secret, dev, "/v1/sms/webhook", smsJson, sms, seq, ts) }
    check("fresh device (counter 0) self-heals past server counter 100 and delivers", first == IngestOutcome.Delivered(false), "$first via seq $seen")
    check("payment became paid", get("/v1/payments/$id").contains("\"status\":\"paid\""), get("/v1/payments/$id").take(0) + "status=paid")

    val dup = ReplayRecovery.run(counter, now) { seq, ts -> send(secret, dev, "/v1/sms/webhook", smsJson, sms, seq, ts) }
    check("lost-response retry (same SMS, new seq) is safe: server dedupes by TrxID", dup == IngestOutcome.Delivered(true), dup)

    val hbPayload = HeartbeatPayload.canonical(87, true, 3)
    val hb = ReplayRecovery.run(counter, now) { seq, ts -> send(secret, dev, "/v1/devices/heartbeat", """{"battery_level":87,"is_charging":true,"pending_count":3}""", hbPayload, seq, ts) }
    check("signed heartbeat accepted by patched server", hb == IngestOutcome.Delivered(false), hb)
    check("heartbeat updated device status", get("/v1/devices/status").contains("\"batteryLevel\":87"), "batteryLevel=87")

    val bad = ReplayRecovery.run(counter, now) { seq, ts -> send("wrong-secret", dev, "/v1/sms/webhook", smsJson, sms, seq, ts) }
    check("wrong secret -> AuthRejected (kept in queue, not dropped)", bad is IngestOutcome.AuthRejected && !bad.clockDrift, bad)

    val drift = ReplayRecovery.run(counter, now) { seq, ts -> send(secret, dev, "/v1/sms/webhook", smsJson, sms, seq, ts - 1000) }
    check("clock 1000s off -> AuthRejected with clockDrift=true", drift is IngestOutcome.AuthRejected && drift.clockDrift, drift)

    val unparse = ReplayRecovery.run(counter, now) { seq, ts ->
        val junk = "hello this is not an mfs message"
        send(secret, dev, "/v1/sms/webhook", """{"sender":"bKash","raw_sms":${esc(junk)},"sim_slot":1,"client_msg_id":"e2e-junk"}""", junk, seq, ts)
    }
    check("unparseable SMS -> Rejected (terminal, server quarantines it)", unparse is IngestOutcome.Rejected, unparse)

    val missing = post("/v1/sms/webhook", smsJson, emptyMap())
    check("request with no signature headers is refused by server", missing.first == 401, missing.first)

    println("--- end-to-end: ${if (failures == 0) "ALL PASSED" else "$failures FAILED"}   (final device counter = ${counter.current()})")
    System.exit(if (failures == 0) 0 else 1)
}
var stored = 0L
