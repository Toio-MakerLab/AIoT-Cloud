# Device Template Example — ESP32 + 2 Relay + Buzzer

Example `device_templates` record for an ESP32-based relay controller node with
two relay channels and an onboard buzzer. Created via `POST /api/device-templates`
(ADMIN/ROOT only).

## Request

```
POST /api/device-templates
Authorization: Bearer <admin-or-root-access-token>
Content-Type: application/json
```

```json
{
  "name": "ESP32 + 2 Relay + Buzzer",
  "type": "RELAY_NODE",
  "description": "ESP32-based relay controller node with two independently switched relay channels and an onboard buzzer for audible alerts.",
  "manufacturer": "Espressif ESP32",
  "telemetrySchema": [
    { "key": "relay1", "label": "Relay 1", "unit": "state" },
    { "key": "relay2", "label": "Relay 2", "unit": "state" },
    { "key": "buzzer", "label": "Buzzer", "unit": "state" },
    { "key": "rssi", "label": "WiFi Signal", "unit": "dBm" }
  ],
  "isActive": true
}
```

## Response

```json
{
  "error": 0,
  "data": {
    "id": "798474464924295168",
    "createdAt": "2026-08-22T01:52:27.374Z",
    "updatedAt": "2026-08-22T01:52:27.374Z",
    "name": "ESP32 + 2 Relay + Buzzer",
    "type": "RELAY_NODE",
    "description": "ESP32-based relay controller node with two independently switched relay channels and an onboard buzzer for audible alerts.",
    "manufacturer": "Espressif ESP32",
    "icon": null,
    "telemetrySchema": [
      { "key": "relay1", "unit": "state", "label": "Relay 1" },
      { "key": "relay2", "unit": "state", "label": "Relay 2" },
      { "key": "buzzer", "unit": "state", "label": "Buzzer" },
      { "key": "rssi", "unit": "dBm", "label": "WiFi Signal" }
    ],
    "isActive": true
  },
  "message": "success"
}
```

## Notes

- `telemetrySchema` field keys (`relay1`, `relay2`, `buzzer`, `rssi`) are the
  expected JSON keys in each MQTT telemetry payload published to
  `devices/{deviceId}/telemetry` for devices registered under this template.
- Dashboard panels this round are read-only (latest value + history) — no
  relay control from the UI yet, per the current implementation scope.
- A device is bound to this template via `POST /api/devices/register` with
  `{ "deviceId": "<physical-id>", "templateId": "798474464924295168", "name": "..." }`.
  The response's `deviceSecret` is shown once — the firmware must store it and
  send it as `X-Device-Secret` on every provisioning call below.

## ESP32 firmware — fetch boot config

On boot, the firmware calls this endpoint to learn how to push telemetry (which
transport, broker/topic, credentials). No JWT — auth is the device secret issued
at registration.

```
GET /api/devices/{deviceId}/boot-config
X-Device-Secret: <deviceSecret from registration>
```

```json
{
  "error": 0,
  "data": {
    "deviceId": "esp32-relay-01",
    "apiEndpoint": null,
    "pushChannel": "MQTT",
    "mqtt": {
      "broker": "mqtt://103.146.23.145:1883",
      "port": 1883,
      "username": "iot-gateway",
      "password": "1234",
      "topics": {
        "telemetry": "devices/esp32-relay-01/telemetry",
        "command": "devices/esp32-relay-01/command",
        "status": "devices/esp32-relay-01/status"
      }
    },
    "http": null,
    "kafka": null,
    "configVersion": 1
  },
  "message": "success"
}
```

- `pushChannel` selects which of `mqtt` / `http` / `kafka` is populated (the
  other two are `null`); the firmware should branch on it rather than assuming MQTT.
- `mqtt`/`http`/`kafka` are only the *default fallback* (server-configured broker,
  per-device topic path) until a user overrides them via
  `PATCH /api/devices/{id}/config` (JWT-authenticated, dashboard-side) — at
  which point this endpoint returns the override instead.
- `configVersion` increments on every config change. Firmware can poll
  `boot-config` periodically (or on a backend-triggered command) and compare
  against its last-applied version to know when to re-fetch and reconnect.
- Wrong/missing `X-Device-Secret` → `401 Unauthorized`; unknown `deviceId` →
  `404` with `error.deviceNotFound`.

## ESP32 firmware — push telemetry (HTTP channel)

Only relevant when `pushChannel` is `HTTP`; MQTT/Kafka devices publish directly
to their broker instead using the `mqtt`/`kafka` config above.

```
POST /api/devices/{deviceId}/push
X-Device-Secret: <deviceSecret from registration>
Content-Type: application/json

{ "relay1": "ON", "relay2": "OFF", "buzzer": "OFF", "rssi": -62 }
```

Same `X-Device-Secret` auth as `boot-config`. Body is stored as-is as the
telemetry payload (`recordTelemetry`); no schema validation against
`telemetrySchema` is enforced server-side.
