/**
 * Kafka topic used for the KAFKA push channel. Unlike MQTT/HTTP, Kafka topics are
 * broker-managed partitioned logs rather than free-form per-device paths, so instead of
 * a topic-per-device we use one shared topic and key/partition by deviceId. Each message
 * is expected to carry `{ deviceId, ...telemetry }`.
 */
export const KAFKA_TELEMETRY_TOPIC = 'devices.cloud.telemetry';

/**
 * Shared Kafka topic for backend -> gateway command delivery. Devices on the KAFKA push
 * channel sit behind a local gateway (ESP32 -> gateway -> cloud); the gateway consumes this
 * topic and relays matching commands to the ESP32 over its own local MQTT broker. Each
 * message carries `{ deviceId, key, value }`, keyed/partitioned by deviceId like the
 * telemetry topic.
 */
export const KAFKA_COMMAND_TOPIC = 'devices.cloud.commands';

/**
 * Shared Kafka topic for gateway -> backend device status (online/offline) uplink.
 * Each message carries `{ deviceId, status }`, keyed/partitioned by deviceId like the
 * telemetry topic.
 */
export const KAFKA_STATUS_TOPIC = 'devices.cloud.status';

/**
 * Shared Kafka topic for gateway -> backend raw device-event envelopes — distinct from
 * `devices.telemetry`/`devices.status`. Each message carries `{ device_id, topic, message }`,
 * where `topic` names the logical channel the event relates to (e.g. `devices.commands` when
 * it's confirming a command the gateway just relayed downstream) and `message` is a raw
 * `key=value` string (e.g. `"relay1=OFF"`) describing the resulting per-channel actuator state.
 * Keyed/partitioned by `device_id` like the other topics.
 */
export const KAFKA_DEVICE_EVENTS_TOPIC = 'devices.cloud.events';

/**
 * Shared Kafka topic for gateway/device -> backend alert uplink: the device/gateway evaluated one
 * of its own rules locally and it fired — distinct from the threshold breaches the backend
 * derives itself from `devices.cloud.telemetry` (see `DeviceWarningListener.handleTelemetry`).
 * Each message carries `{ deviceId, metric, reading, rule, channels? }`, keyed/partitioned by
 * deviceId like the other topics. `rule` is a `"<metric>.<field><op><threshold>[:<key>=<value>]"`
 * expression (e.g. `"sensor.apms>10:relay2=ON"`) — the condition that fired, and optionally the
 * resulting action taken; `reading[field]` supplies the value that tripped it. A simple
 * `{ deviceId, message, channels? }` shape (pre-rendered message, no rule) is also accepted, for
 * publishers that don't want to encode a rule.
 */
export const KAFKA_ALERT_TOPIC = 'devices.cloud.alerts';
