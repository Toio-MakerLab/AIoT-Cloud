# Gateway → Cloud Kafka Integration

Contract between `aiot-gate` (local gateway, aggregates devices on a private
MQTT broker) and this backend. The gateway is responsible for normalizing
raw device data into this format before publishing — the backend does not
parse device-specific payload shapes for Kafka-sourced data.

## The gateway is itself a device

`aiot-gate` registers itself (`POST /devices/register`) against the seeded
**"aiot-gate Gateway"** template (`DeviceTemplateType.GATEWAY`), the same way
any physical device registers against a sensor/relay template. It then
reports its own health as telemetry (`uptimeSeconds`, `bridgedDeviceCount`,
`cpuLoadPercent`, `memoryUsagePercent`, `kafkaConnected`) and status
(`ONLINE`/`OFFLINE`) via the same `devices.telemetry`/`devices.status` Kafka
topics used for every other device, using its *own* `deviceId` — this is
what makes gateway health visible on the Devices page alongside the devices
it bridges. There is no separate "gateway API" — it's a regular device from
the backend's point of view, set to `pushChannel: "KAFKA"`.

The template also defines one action, `restart` (`BUTTON`) — triggering it
(`POST /devices/:id/actions`) publishes to `devices.commands` as usual; the
gateway should treat a command whose `deviceId` matches its own as
self-directed (restart itself) rather than something to relay downstream.

## Connection

Gateway connects as its own Kafka client (own `clientId`/consumer group),
producing to the shared broker at `KAFKA_BROKERS`. No credentials are
exchanged over Kafka itself — a device is only accepted once it's registered
via `POST /devices/register` (see below).

## Topics

Three shared topics, **not** per-device. Devices are distinguished by the
`deviceId` field inside the payload, and every message must be produced with
`deviceId` as the **Kafka message key** (`kafkajs`: `{ key: deviceId, value: JSON.stringify(payload) }`)
so all messages for one device land in the same partition and are processed
in order.

| Topic | Direction | Constant |
|---|---|---|
| `devices.telemetry` | gateway → cloud | `KAFKA_TELEMETRY_TOPIC` |
| `devices.status` | gateway → cloud | `KAFKA_STATUS_TOPIC` |
| `devices.commands` | cloud → gateway | `KAFKA_COMMAND_TOPIC` |

Defined in `src/constants/kafka-topics.ts`.

### `devices.telemetry` (gateway → cloud)

```json
{
  "deviceId": "01a04142-ba64-79c2-b29c-6c8ae29af427",
  "temperature": 26.4,
  "humidity": 58.2,
  "current_ch1": 0.42
}
```

- `deviceId` (string, required) — must match the `deviceId` the device was
  registered with (`POST /devices/register`). Everything except `deviceId`
  is stored verbatim as the telemetry row's JSON `payload`.
- No unit/shape restrictions on the remaining fields — the gateway sends
  whatever fields the device template expects (mirrors what the ESP32 would
  otherwise publish over MQTT telemetry).
- Ingestion timestamp is stamped server-side (`recordedAt = now()`); include
  a `timestamp` field in the payload if the gateway needs to preserve the
  original sample time — it will be stored as-is inside `payload` but is not
  interpreted by the backend.
- Consumed by `KafkaController.handleTelemetry` → `DeviceService.recordTelemetry`.

### `devices.status` (gateway → cloud)

```json
{
  "deviceId": "01a04142-ba64-79c2-b29c-6c8ae29af427",
  "status": "ONLINE"
}
```

- `status` — `"ONLINE"` or `"OFFLINE"` (case-insensitive, trimmed server-side).
  Any other value is logged and ignored.
- Send `"ONLINE"` when a device (re)connects to the gateway's local MQTT
  broker, `"OFFLINE"` when its LWT fires or the gateway otherwise detects it
  dropped.
- Consumed by `KafkaController.handleStatus` → `DeviceService.handleDeviceStatusMessage`.

### `devices.commands` (cloud → gateway)

```json
{
  "deviceId": "01a04142-ba64-79c2-b29c-6c8ae29af427",
  "key": "relay_1",
  "value": "ON"
}
```

- Published by the backend (`DeviceService.triggerDeviceAction`) when a user
  triggers a device action via `POST /devices/:id/actions`.
- The gateway consumes this topic, looks up `deviceId` among the devices it
  bridges, and relays `{ key, value }` to that device over its own local
  MQTT (e.g. publishing to the device's per-channel command topic).

## Fetching device config (REST)

Before bridging a device, the gateway fetches its config to learn the push
channel, per-channel command topics (for relaying `devices.commands` back to
the device's local MQTT), and any Kafka override.

```
GET /devices/{deviceId}/boot-config
x-device-secret: <shared secret>
```

- Same shared-secret model as MQTT credentials — any non-revoked secret
  works for any `deviceId` (see `DeviceSecretService`/`DeviceSecretGuard`,
  `POST /device-secrets` to mint one). Not per-device, not a user JWT.
- `{deviceId}` must already be registered (`POST /devices/register`) —
  unregistered devices get `404` here, independent of the Kafka
  unclaimed-device flow below (that flow is for telemetry/status uplink
  only, not this config lookup).
- Response (`ResponseCore<DeviceConfigDto>`):

```json
{
  "error": 0,
  "message": "",
  "data": {
    "deviceId": "01a04142-ba64-79c2-b29c-6c8ae29af427",
    "apiEndpoint": null,
    "pushChannel": "KAFKA",
    "mqtt": {
      "broker": "mqtt://gateway.local",
      "port": 1883,
      "username": "iot-gateway",
      "password": "***",
      "topics": {
        "telemetry": "devices/01a04142-ba64-79c2-b29c-6c8ae29af427/telemetry",
        "command": "devices/01a04142-ba64-79c2-b29c-6c8ae29af427/command",
        "status": "devices/01a04142-ba64-79c2-b29c-6c8ae29af427/status",
        "channels": [
          { "index": 1, "key": "relay_1", "label": "Relay 1", "topic": "devices/01a04142-ba64-79c2-b29c-6c8ae29af427/channel/1/command" },
          { "index": 2, "key": "relay_2", "label": "Relay 2", "topic": "devices/01a04142-ba64-79c2-b29c-6c8ae29af427/channel/2/command" }
        ]
      }
    },
    "http": null,
    "kafka": null,
    "configVersion": 3
  }
}
```

- `mqtt` is present regardless of `pushChannel` — it always describes the
  device's **local** MQTT topics on the gateway's own broker, since that's
  how the gateway talks to the physical device either way. `pushChannel`
  tells the gateway which **uplink** to cloud to use (`MQTT` direct,
  `KAFKA` via this gateway, `HTTP`).
- `topics.channels[].key` matches the `key` field the gateway will receive
  on `devices.commands` — use it to look up which local topic to relay a
  given command to (`topics.channels[].topic`).
- Poll this per device when first seen, and again if `configVersion`
  changes (bump on every `PATCH /devices/:id/config`) — no push
  notification for config changes exists yet.

## Unregistered devices

If `deviceId` on `devices.telemetry` or `devices.status` doesn't match any
registered device, the backend does **not** drop the message silently — it
upserts an "unclaimed device" record (`unclaimed_devices` table, surfaced via
`GET /devices/unclaimed`) so a user can register it from the web UI. Once
registered, subsequent messages for that `deviceId` are processed normally.

## Why one shared topic per direction (not per-device)

Kafka topics are broker-managed partitioned logs, not free-form per-device
paths like MQTT. Creating a topic per device doesn't scale operationally
(topic count, partition rebalancing) — instead there's one topic per message
type, and devices are distinguished by `deviceId` in the key/payload. This
also means the backend's Kafka consumer never needs to know about a device's
existence ahead of time or dynamically subscribe to new topics as devices
are added — `aiot-gate` only ever needs these three fixed topic names.
