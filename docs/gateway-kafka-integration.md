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
producing to the shared broker at `KAFKA_BROKERS`. Registering a device via
`POST /devices/register` is what makes its `deviceId` accepted — that's
unrelated to the Kafka connection itself, which the gateway authenticates
separately if the broker requires it.

The backend supports connecting to a broker with SASL auth over TLS (e.g. a
managed/hosted Kafka), configured via env vars — not per-device:

| Env var | Purpose |
|---|---|
| `KAFKA_SSL_ENABLED` | `true` to connect over TLS |
| `KAFKA_SASL_ENABLED` | `true` to enable SASL auth |
| `KAFKA_SASL_MECHANISM` | `plain` \| `scram-sha-256` \| `scram-sha-512` |
| `KAFKA_SASL_USERNAME` / `KAFKA_SASL_PASSWORD` | SASL credentials |

`aiot-gate` should use the same broker/SSL/SASL settings — fetch them via
`GET /devices/{deviceId}/boot-config` (see below): the `kafka` field on the
response carries `username`/`password` alongside `brokers`, so the gateway
doesn't need its own separate copy of these secrets configured out of band.

## Topics

Six shared topics, **not** per-device. Devices are distinguished by the
`deviceId` (or `device_id` — see `devices.events` below) field inside the
payload, and every message must be produced with the device id as the
**Kafka message key** (`kafkajs`: `{ key: deviceId, value: JSON.stringify(payload) }`)
so all messages for one device land in the same partition and are processed
in order.

| Topic | Direction | Constant |
|---|---|---|
| `devices.telemetry` | gateway → cloud | `KAFKA_TELEMETRY_TOPIC` |
| `devices.status` | gateway → cloud | `KAFKA_STATUS_TOPIC` |
| `devices.commands` (default) | cloud → gateway | `KAFKA_COMMAND_TOPIC` |
| `devices.gateway.commands` | cloud → gateway | `KAFKA_GATEWAY_COMMANDS_TOPIC` |
| `devices.events` | gateway → cloud | `KAFKA_DEVICE_EVENTS_TOPIC` |
| `devices.cloud.alerts` | gateway/device → cloud | `KAFKA_ALERT_TOPIC` |

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

Published on the device's own `config.kafka.commandTopic` when it has one
configured (e.g. a gateway pointed at its own dedicated topic, such as
`device.gateway.command`), falling back to the shared `devices.commands`
(`KAFKA_COMMAND_TOPIC`) bus for devices with no Kafka config of their own
(e.g. MQTT-only relay nodes, bridged by a separate gateway device that IS
listening on the shared bus).

```json
{
  "deviceId": "01a04142-ba64-79c2-b29c-6c8ae29af427",
  "key": "relay_1",
  "value": "ON",
  "topic": "devices/01a04142-ba64-79c2-b29c-6c8ae29af427/channel/1/command"
}
```

- Published by the backend (`DeviceService.triggerDeviceAction`) when a user
  triggers a device action via `POST /devices/:id/actions`.
- `topic` (string, optional) — the device's own downlink MQTT command topic
  for this channel (NOT the Kafka topic the message itself was sent on),
  resolved server-side from the device's stored config: the per-channel
  topic matching `key` in `config.mqtt.topics.channels`, falling back to
  `config.mqtt.topics.command`. Omitted for devices with no MQTT config of
  their own (e.g. a gateway bridged directly over the KAFKA push channel).
- The gateway consumes this topic, looks up `deviceId` among the devices it
  bridges, and relays `{ key, value }` to that device over its own local
  MQTT — publishing on `topic` directly rather than re-deriving it from a
  separately-cached boot-config.

### `devices.gateway.commands` (cloud → gateway)

A dedicated topic, separate from `devices.commands` above — this is a
"re-fetch your boot-config now" nudge, not an actuator command, and only
ever means something to a device that's itself a Kafka consumer (a gateway),
never a plain MQTT node bridged by one. Every gateway (any device registered
with `pushChannel: "KAFKA"`) should subscribe to this fixed topic name — it
is **not** overridden by `config.kafka.commandTopic` the way `devices.commands`
can be.

```json
{
  "deviceId": "01a04142-ba64-79c2-b29c-6c8ae29af427",
  "type": "config_sync",
  "configVersion": 4
}
```

- Published by the backend (`DeviceService.pushConfigSync`) when a user
  clicks "Push to device" on the Device Config dialog, or whenever else the
  cloud wants a gateway to pick up a config change immediately instead of
  waiting for its own poll/reboot cycle.
- `type` (string) — always `"config_sync"` for now; treat an unrecognized
  `type` as a no-op rather than an error, in case new push types are added
  later.
- `configVersion` (number) — the config version the backend had at publish
  time, informational only (e.g. for logging "was asked to sync to v4"). The
  gateway should still re-fetch `GET /devices/{deviceId}/boot-config` as the
  actual source of truth rather than trust this number alone — it's a nudge
  to check, not the new config itself.
- On receipt, re-fetch this gateway's own boot-config (`GET
  /devices/{deviceId}/boot-config` using its own `deviceId`) and apply
  whatever changed (alert rules, failsafe, MQTT/Kafka settings, etc.).
- Only published for devices on the KAFKA push channel — a plain MQTT-push
  node returns `400` from `POST /devices/:id/config/push` since there's no
  Kafka connection of its own to receive this on; a bridged MQTT node's
  owning gateway would need to be synced instead.

### `devices.events` (gateway → cloud)

```json
{
  "device_id": "01a04142-ba64-79c2-b29c-6c8ae29af427",
  "topic": "devices.commands",
  "message": "relay1=OFF"
}
```

- A raw event envelope, separate from `devices.telemetry`/`devices.status`
  — used for reporting the applied result of something the gateway did
  locally (e.g. confirming a `devices.commands` relay actually landed on the
  device) rather than a periodic telemetry sample.
- `device_id` (string, required, **snake_case** — this topic's payload shape
  differs from the other three) — must match a registered device the same
  way the other topics do.
- `topic` (string, optional) — names the logical topic/channel the event is
  about; free-form, stored as-is for unclaimed-device debugging, not
  interpreted by the backend.
- `message` (string, required) — a raw `key=value` pair (e.g. `"relay1=OFF"`)
  describing one channel's resulting actuator state. Merged into the
  device's persisted `channelStates` (`{ relay1: "OFF" }`), which is
  broadcast to the dashboard over the `channelState` websocket event.
  Messages that aren't a parseable `key=value` string are logged and
  ignored.
- Also marks the device `ONLINE` (same as telemetry) since receiving one
  implies the gateway is actively bridging it.
- Consumed by `KafkaController.handleDeviceEvent` → `DeviceService.handleDeviceChannelEvent`.

### `devices.cloud.alerts` (gateway/device → cloud)

Rule-fired shape — the device/gateway evaluated one of its own rules locally and it fired:

```json
{
  "deviceId": "G25admrd7c63",
  "metric": "sensor",
  "reading": {
    "apms": 11.6,
    "co2": 564.8,
    "humidity": 61.2,
    "pm25": 18.2,
    "temperature": 28.5
  },
  "rule": "sensor.apms>10:relay2=ON"
}
```

- Distinct from the threshold breaches the backend derives itself from `devices.cloud.telemetry`
  (see `DeviceWarningListener.handleTelemetry`) — here the device/gateway already decided the rule
  fired; the backend just renders and forwards it.
- `metric` (string, optional) — a label for the reading group (e.g. `"sensor"`); falls back to the
  metric segment of `rule` when omitted.
- `reading` (object, optional) — the full sensor snapshot at the time the rule fired; the field the
  rule references (`reading[field]`, e.g. `reading.apms`) is read out and included in the rendered
  message. Extra fields are accepted but otherwise unused.
- `rule` (string, required for this shape) — a
  `"<metric>.<field><op><threshold>[:<key>=<value>]"` expression, e.g. `"sensor.apms>10:relay2=ON"`:
  the condition that fired (`sensor.apms > 10`) and, after the optional `:`, the resulting action
  taken (`relay2=ON`, parsed the same way as `devices.cloud.events`'s `key=value` message). The
  action segment is informational only — the backend does not itself publish a command from it.
  A `rule` that doesn't parse is logged and ignored.
- Renders to e.g. `[Alert] {device name}: sensor.apms = 11.6 (rule: apms > 10) → relay2=ON`.

Pre-rendered shape — for publishers that don't want to encode a rule:

```json
{
  "deviceId": "G25admrd7c63",
  "message": "Vibration exceeded safe limit"
}
```

- `message` (string) — forwarded as-is, prefixed with `[Alert] {device name}: `. Takes precedence
  over `rule`/`reading` when both are present.

Either shape accepts an optional `channels` field:

```json
{ "channels": ["ZALO", "WEB_PUSH"] }
```

- `channels` (array of `NotificationChannelType` — `"ZALO"` \| `"WEB_PUSH"` — optional) — restricts
  delivery to these channels; unrecognized values are dropped, and an empty/omitted list falls
  back to every enabled, linked channel (same fallback `NotificationService.sendWarning` uses
  elsewhere).
- Consumed by `KafkaConsumerService.handleAlert` → `DeviceService.handleDeviceAlert`, which emits
  a `device.alert` domain event picked up by `DeviceWarningListener.handleAlert` →
  `NotificationService.sendWarning`. An unregistered `deviceId` is recorded as an unclaimed device
  like the other topics, rather than dropped.

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
    "kafka": {
      "brokers": "kafka.internal:9092",
      "topic": "devices.telemetry",
      "clientId": "aiot-lab-service",
      "username": "cloud-kafka-user",
      "password": "***"
    },
    "configVersion": 3
  }
}
```

- `kafka` is `null` only when `pushChannel` isn't `"KAFKA"`. When it is, and
  the device has no per-device override configured (the common case), the
  backend fills it in from its own `KAFKA_BROKERS`/`KAFKA_SASL_*` env config
  — `username`/`password` are only present when `KAFKA_SASL_ENABLED=true`.
  `topic` here is always `devices.telemetry` — see the topic list above for
  where to actually publish telemetry vs. status.

- `mqtt` is present regardless of `pushChannel` — it always describes the
  device's **local** MQTT topics on the gateway's own broker, since that's
  how the gateway talks to the physical device either way. `pushChannel`
  tells the gateway which **uplink** to cloud to use (`MQTT` direct,
  `KAFKA` via this gateway, `HTTP`).
- `topics.channels[].key` matches the `key` field the gateway will receive
  on `devices.commands` — use it to look up which local topic to relay a
  given command to (`topics.channels[].topic`).
- Fetch this per device when first seen, and again whenever
  `devices.gateway.commands` (above) delivers a `config_sync` nudge for a
  gateway's own `deviceId` — that's the real-time path. A gateway that also
  wants to self-heal from a missed/dropped push should still poll
  periodically and compare against its last-applied `configVersion` (bumped
  on every `PATCH /devices/:id/config`), since `config_sync` delivery isn't
  guaranteed (e.g. the gateway was offline when it was published).

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
are added — `aiot-gate` only ever needs these fixed topic names.
