# MQTT — Bidirectional Device Commands

Contract for a device connected **directly** to the shared MQTT broker
(`pushChannel: "MQTT"`, boot-config's `kafka` is `null`) — no `aiot-gate`
gateway in between. Devices bridged by a gateway instead follow the Kafka
contract in [`gateway-kafka-integration.md`](./gateway-kafka-integration.md).

## Why this exists

The backend has always *ingested* MQTT (`devices/{deviceId}/telemetry`,
`devices/{deviceId}/status`) via a subscribe-only `Transport.MQTT`
microservice (`MqttController`). Sending a command back down, however, only
ever published onto the Kafka gateway-relay inbox
(`KAFKA_GATEWAY_COMMANDS_TOPIC`) — correct for a device bridged by a gateway,
but a no-op for a device on the `MQTT` push channel with no gateway consuming
that topic. `POST /devices/:id/actions` on such a device silently went
nowhere. `MqttProducerService` (a raw `mqtt` client, connected once at
startup alongside the existing subscriber) closes that gap by publishing
commands straight onto the device's own topic.

## Topics

Per-device, generated from `defaultTelemetryTopic`/`defaultCommandTopic`/
`defaultStatusTopic`/`defaultEventTopic` (`src/constants/mqtt-topics.ts`)
unless overridden via `PATCH /devices/:id/config`'s `mqtt.topics`:

| Topic | Direction | Purpose |
|---|---|---|
| `devices/{deviceId}/telemetry` | device → cloud | sensor readings (unchanged) |
| `devices/{deviceId}/status` | device → cloud | `ONLINE`/`OFFLINE` / LWT (unchanged) |
| `devices/{deviceId}/command` | cloud → device | downlink actuator command |
| `devices/{deviceId}/channel/{n}/command` | cloud → device | per-channel command, multi-relay templates |
| `devices/{deviceId}/event` | device → cloud | **new** — ack for a command the device applied |

## Downlink — `devices/{deviceId}/command` (or the per-channel variant)

Published by `DeviceService.triggerDeviceActionViaMqtt` when a user hits
`POST /devices/:id/actions` on an `MQTT`-push device:

```json
{ "deviceId": "esp32-relay-01", "key": "relay1", "value": "ON" }
```

- The device subscribes to its own command topic(s) at boot (from
  `boot-config`) and applies `value` to the actuator named by `key`.
- The backend applies an **optimistic** `channelStates` update immediately
  after the publish succeeds (same effect the Kafka relay path gets from its
  self-published `devices.events` message) — the dashboard doesn't wait out a
  round trip. `POST /devices/:id/actions` fails (`400
  error.deviceActionTopicNotConfigured`) if the device has no resolvable
  command topic, and (`500 error.deviceActionPublishFailed`) if the broker
  publish itself errors.

## Uplink ack — `devices/{deviceId}/event`

Optional but recommended: after applying a command (or failing to), the
device publishes a confirmation here, same envelope shape as Kafka's
`devices.events`:

```json
{ "key": "relay1", "value": "ON", "status": "ok" }
```

```json
{ "key": "relay1", "value": "ON", "status": "error", "error": "relay stuck" }
```

- `status` defaults to `"ok"` when omitted.
- Routed by `MqttController` (matching `EVENT_TOPIC_REGEX`) to the same
  `DeviceService.handleDeviceChannelEvent` the Kafka path uses — so it can
  correct the optimistic update above (including flipping it to
  `status: "error"`) and fires the same `device.channelState`/
  `device.actionResult` events the dashboard already listens for.
- Not required for the optimistic update to work — a device that never
  publishes here just never gets a second, authoritative confirmation.

## Firmware checklist

1. Fetch `boot-config`; if `mqtt.topics.event` is present, subscribe isn't
   needed (this device *publishes* there) — just remember the topic string.
2. Subscribe to `mqtt.topics.command` (and each `mqtt.topics.channels[].topic`
   for multi-relay templates) at boot.
3. On a received command, apply it, then publish the result to
   `mqtt.topics.event` (fall back to `devices/{deviceId}/event` if the field
   is absent from a cached older boot-config).
