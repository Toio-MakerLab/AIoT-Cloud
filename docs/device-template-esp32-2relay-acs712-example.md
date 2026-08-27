# Device Template — ESP32 Relay 2CH + ACS712

Seeded automatically by migration `1788100000000-SeedRelay2ChAcs712Template` (idempotent —
looked up by name, so it's safe to run repeatedly and won't duplicate). This describes an
ESP32-based relay controller with **2 independently switched relay channels**, each paired
with its own **ACS712 current sensor** so the backend can monitor load current per channel.

## Template shape

```json
{
  "name": "ESP32 Relay 2CH + ACS712",
  "type": "RELAY_NODE",
  "manufacturer": "Espressif ESP32",
  "telemetrySchema": [
    { "key": "relay1", "label": "Relay 1", "unit": "state" },
    { "key": "relay2", "label": "Relay 2", "unit": "state" },
    { "key": "current1", "label": "Channel 1 Current (ACS712)", "unit": "A", "warningMin": 0, "warningMax": 15 },
    { "key": "current2", "label": "Channel 2 Current (ACS712)", "unit": "A", "warningMin": 0, "warningMax": 15 },
    { "key": "rssi", "label": "WiFi Signal", "unit": "dBm" }
  ],
  "actionSchema": [
    { "key": "relay1", "label": "Relay 1", "type": "TOGGLE", "onValue": "ON", "offValue": "OFF" },
    { "key": "relay2", "label": "Relay 2", "type": "TOGGLE", "onValue": "ON", "offValue": "OFF" }
  ],
  "isActive": true
}
```

- `telemetrySchema` keys are what the firmware publishes on the telemetry topic; `warningMax: 15`
  assumes a 20A-rated ACS712 module driving a load under 15A continuous — adjust per your relay's
  actual rating.
- `actionSchema` is what backend `POST /api/devices/{id}/actions` validates `key`/`value` against,
  and what `GET /devices/{deviceId}/boot-config` uses to auto-generate one MQTT topic per relay
  channel (see below) — adding a 3rd relay to `actionSchema` here automatically gives it a 3rd
  channel topic, no code change needed.

## Register a device under this template

```
POST /api/devices/register
Authorization: Bearer <user-access-token>
Content-Type: application/json

{ "deviceId": "esp32-relay-01", "templateId": "<id of the seeded template>", "name": "Relay Panel A" }
```

Device auth is now a **shared secret** (not per-device) — see `POST /api/device-secrets`
(ADMIN/ROOT) to issue one. The firmware sends it as `x-device-secret` on every call below.

## ESP32 firmware — fetch boot config

```
GET /api/devices/esp32-relay-01/boot-config
x-device-secret: <shared device secret>
```

```json
{
  "error": 0,
  "data": {
    "deviceId": "esp32-relay-01",
    "pushChannel": "MQTT",
    "mqtt": {
      "broker": "mqtt://103.146.23.145:1883",
      "port": 1883,
      "username": "iot-gateway",
      "password": "1234",
      "topics": {
        "telemetry": "devices/esp32-relay-01/telemetry",
        "command": "devices/esp32-relay-01/command",
        "status": "devices/esp32-relay-01/status",
        "channels": [
          { "index": 1, "key": "relay1", "label": "Relay 1", "topic": "devices/esp32-relay-01/channel/1/command" },
          { "index": 2, "key": "relay2", "label": "Relay 2", "topic": "devices/esp32-relay-01/channel/2/command" }
        ]
      }
    },
    "http": null,
    "kafka": null,
    "configVersion": 1
  },
  "message": "success"
}
```

- `topics.channels` only appears for `RELAY_NODE` templates and follows `actionSchema` order
  1:1 — firmware should subscribe to each `channels[i].topic` to receive that relay's ON/OFF
  command independently, instead of parsing a shared generic `command` topic.
- `status` topic is where the firmware publishes online/offline: send `"ONLINE"` right after
  connecting, and configure it as the MQTT **Last Will and Testament** payload (`"OFFLINE"`,
  retained) so the backend marks the device offline immediately on an unclean disconnect. If no
  telemetry or status message arrives for 1 minute, the backend sweeps the device to `OFFLINE`
  automatically regardless.

## ESP32 firmware — publish telemetry (MQTT)

Publish to `topics.telemetry` on a fixed interval (e.g. every 5–10s):

```json
{ "relay1": "ON", "relay2": "OFF", "current1": 2.34, "current2": 0.01, "rssi": -62 }
```

### Reading the ACS712

The ACS712 outputs an analog voltage centered at `Vcc/2` (~1.65V on a 3.3V ADC) that swings
proportionally to current, at a fixed sensitivity per variant (5A: 185 mV/A, 20A: 100 mV/A,
30A: 66 mV/A). Example for the 20A variant on ESP32's 12-bit ADC:

```cpp
const float ADC_VREF = 3.3f;
const float ADC_MAX = 4095.0f;
const float ACS712_SENSITIVITY = 0.100f; // V/A, 20A variant
const float ACS712_ZERO_V = ADC_VREF / 2.0f;

float readAcs712Current(int adcPin) {
  // Average several samples to smooth out ADC/mains noise.
  long sum = 0;
  const int samples = 200;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(adcPin);
    delayMicroseconds(100);
  }
  float voltage = (sum / (float)samples) * (ADC_VREF / ADC_MAX);
  return (voltage - ACS712_ZERO_V) / ACS712_SENSITIVITY;
}

void loop() {
  float current1 = fabsf(readAcs712Current(CURRENT1_PIN));
  float current2 = fabsf(readAcs712Current(CURRENT2_PIN));
  // ... publish { relay1, relay2, current1, current2, rssi } to topics.telemetry
}
```

Calibrate `ACS712_ZERO_V` per-board at startup (average the ADC with no load) instead of
assuming an exact `Vcc/2`, since the sensor's true zero-current output varies board to board.

## ESP32 firmware — receive relay commands

Subscribe to each entry in `topics.channels`. The payload the backend forwards is the raw
`value` from `POST /api/devices/{id}/actions` (e.g. `"ON"` / `"OFF"` per `actionSchema`):

```
Topic: devices/esp32-relay-01/channel/1/command
Payload: ON
```

```cpp
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String value = String((char*)payload, length);
  if (String(topic) == relay1CommandTopic) digitalWrite(RELAY1_PIN, value == "ON" ? HIGH : LOW);
  if (String(topic) == relay2CommandTopic) digitalWrite(RELAY2_PIN, value == "ON" ? HIGH : LOW);
}
```

## Wiring

| Signal              | ESP32 pin (example) | Notes                                   |
| -------------------- | -------------------- | ---------------------------------------- |
| Relay 1 control       | GPIO 26              | Through relay module's opto-input        |
| Relay 2 control       | GPIO 27              | Through relay module's opto-input        |
| ACS712 #1 analog out  | GPIO 34 (ADC1_CH6)   | ACS712 in series with channel 1's load    |
| ACS712 #2 analog out  | GPIO 35 (ADC1_CH7)   | ACS712 in series with channel 2's load    |

Use ADC1 pins (32–39) for the current sensors — ADC2 is unusable while Wi-Fi is active on ESP32.
