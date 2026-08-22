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
