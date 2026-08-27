/**
 * Kafka topic used for the KAFKA push channel. Unlike MQTT/HTTP, Kafka topics are
 * broker-managed partitioned logs rather than free-form per-device paths, so instead of
 * a topic-per-device we use one shared topic and key/partition by deviceId. Each message
 * is expected to carry `{ deviceId, ...telemetry }`.
 */
export const KAFKA_TELEMETRY_TOPIC = 'devices.telemetry';

/**
 * Shared Kafka topic for backend -> gateway command delivery. Devices on the KAFKA push
 * channel sit behind a local gateway (ESP32 -> gateway -> cloud); the gateway consumes this
 * topic and relays matching commands to the ESP32 over its own local MQTT broker. Each
 * message carries `{ deviceId, key, value }`, keyed/partitioned by deviceId like the
 * telemetry topic.
 */
export const KAFKA_COMMAND_TOPIC = 'devices.commands';

/**
 * Shared Kafka topic for gateway -> backend device status (online/offline) uplink.
 * Each message carries `{ deviceId, status }`, keyed/partitioned by deviceId like the
 * telemetry topic.
 */
export const KAFKA_STATUS_TOPIC = 'devices.status';
