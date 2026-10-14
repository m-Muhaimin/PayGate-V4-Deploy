# Server change required: device-signed heartbeat

The Android app signs its heartbeat with the same HMAC scheme as SMS ingest. Your current
`POST /v1/devices/heartbeat` requires the shared **admin token** and is hardwired to
`dev_superadmin_01`, so the app's heartbeat is rejected (SMS forwarding is unaffected).

Replace the route in `server.ts` with:

```ts
// POST /v1/devices/heartbeat — authenticated by the device's HMAC signature, not the admin token.
app.post('/v1/devices/heartbeat', async (req: Request, res: Response) => {
  const deviceId = req.headers['x-device-id'] as string;
  const seqHeader = req.headers['x-device-seq'] as string;
  const timestampHeader = req.headers['x-device-timestamp'] as string;
  const signatureHeader = req.headers['x-device-signature'] as string;

  if (!deviceId || !seqHeader || !timestampHeader || !signatureHeader) {
    return res.status(401).json({ error: '401 Unauthorized: device signature headers missing' });
  }
  const device = gatewayStore.getDevice(deviceId);
  if (!device) return res.status(403).json({ error: '403 Forbidden: Unrecognized device identifier' });

  const { battery_level, is_charging, pending_count } = req.body ?? {};
  if (!Number.isInteger(battery_level) || typeof is_charging !== 'boolean' || !Number.isInteger(pending_count)) {
    return res.status(400).json({ error: 'battery_level, is_charging, pending_count required' });
  }

  // Must match HeartbeatPayload.canonical() in the Android app.
  const canonical = `HEARTBEAT|battery=${battery_level}|charging=${is_charging ? 1 : 0}|pending=${pending_count}`;
  const seqNo = parseInt(seqHeader, 10);

  const verification = await verifyDeviceIngestSignature(
    device.deviceSecret,
    device.lastSeqNo,
    { deviceId, seqNo, timestamp: parseInt(timestampHeader, 10), rawSms: canonical },
    signatureHeader,
    300,
  );
  if (!verification.isValid) {
    return res.status(403).json({
      error: '403 Forbidden: Device signature verification failed',
      details: verification.reason,
    });
  }

  gatewayStore.updateDeviceSeq(deviceId, seqNo);
  device.batteryLevel = battery_level;
  device.isCharging = is_charging;
  device.status = 'online';
  device.lastHeartbeat = new Date().toISOString();
  return res.json({ status: 'ok', lastHeartbeat: device.lastHeartbeat });
});
```

Heartbeats and SMS share one per-device counter; the app serialises them, so ordering is safe.
