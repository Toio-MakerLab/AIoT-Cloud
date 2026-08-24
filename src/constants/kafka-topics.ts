/**
 * Kafka topic used for the KAFKA push channel. Unlike MQTT/HTTP, Kafka topics are
 * broker-managed partitioned logs rather than free-form per-device paths, so instead of
 * a topic-per-device we use one shared topic and key/partition by deviceId. Each message
 * is expected to carry `{ deviceId, ...telemetry }`.
 */
export const KAFKA_TELEMETRY_TOPIC = 'devices.telemetry';
