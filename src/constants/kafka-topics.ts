/**
 * Kafka topic used for the KAFKA push channel. Unlike MQTT/HTTP, Kafka topics are
 * broker-managed partitioned logs rather than free-form per-device paths, so instead of
 * a topic-per-device we use one shared topic and key/partition by deviceId. Each message
 * is expected to carry `{ deviceId, ...telemetry }`.
 */
export const KAFKA_TELEMETRY_TOPIC = 'devices.cloud.telemetry';

/**
 * Shared Kafka topic for gateway -> backend uplink of a channel/state change the gateway itself
 * decided to make — as opposed to `KAFKA_DEVICE_EVENTS_TOPIC`, which reports the outcome of a
 * command the backend told it to relay (see `KAFKA_GATEWAY_COMMANDS_TOPIC`). Covers anything the
 * gateway applies on its own initiative: a locally-fired automation rule flipping a relay, a
 * physical/local input, or any other gateway-initiated change with no preceding cloud command.
 * Each message carries `{ deviceId, key, value }`, keyed/partitioned by deviceId like the other
 * topics, and is handled the same way as `KAFKA_DEVICE_EVENTS_TOPIC` — merged into the device's
 * `channelStates` and broadcast over `device.channelState`/`device.actionResult`.
 *
 * `cloud` in the name is a holdover from when this was the downlink command bus (before the
 * gateway-initiated-change use case existed) — the topic itself wasn't renamed, only its
 * direction/purpose, so an integration written against the old (cloud -> gateway) contract needs
 * updating to publish here instead of consuming.
 */
export const KAFKA_COMMAND_TOPIC = 'devices.cloud.commands';

/**
 * The shared per-gateway inbox topic: a gateway's fixed subscription (not overridden by
 * `config.kafka.commandTopic`) for every backend -> gateway downlink, distinguished by which
 * fields are present:
 * - Actuator commands to relay onward — `{ deviceId, key, value, topic? }` — published by
 *   `DeviceService.triggerDeviceAction` whenever a user triggers a device action, for every
 *   device (including a gateway's own self-directed actions, e.g. `restart` — the gateway treats
 *   a command whose `deviceId` matches its own as self-directed rather than something to relay).
 * - Config-sync nudges — `{ deviceId, type: 'config_sync', configVersion }` — published by
 *   `DeviceService.pushConfigSync`, a "re-fetch your boot-config now" signal, not an actuator
 *   command.
 * Either way only ever means something to a device that's itself a Kafka consumer (a gateway),
 * never a plain MQTT node bridged by one. Keyed/partitioned by deviceId like the other topics.
 */
export const KAFKA_GATEWAY_COMMANDS_TOPIC = 'devices.gateway.commands';

/**
 * Dedicated Kafka topic for backend -> gateway relay-action notifications — published by
 * `DeviceService.triggerDeviceAction` right alongside the real command it sends on
 * `KAFKA_GATEWAY_COMMANDS_TOPIC` (or the device's own `config.kafka.commandTopic`). Unlike that
 * topic, a gateway is not expected to relay from here — this is audit/observability-only, so the
 * gateway knows a dashboard-initiated action was dispatched for one of its bridged devices without
 * having to infer it from a duplicate `KAFKA_GATEWAY_COMMANDS_TOPIC` message. Each message carries
 * `{ deviceId, key, value, topic?, requestedAt }`, keyed/partitioned by deviceId like the other
 * topics.
 */
export const KAFKA_GATEWAY_EVENTS_TOPIC = 'devices.gateway.events';

/**
 * Shared Kafka topic for gateway -> backend device status (online/offline) uplink.
 * Each message carries `{ deviceId, status }`, keyed/partitioned by deviceId like the
 * telemetry topic.
 */
export const KAFKA_STATUS_TOPIC = 'devices.cloud.status';

/**
 * Shared Kafka topic for gateway -> backend per-channel command-result envelopes — distinct from
 * `devices.cloud.telemetry`/`devices.cloud.status`. Each message carries
 * `{ deviceId, key, value, topic?, status, error? }`: the gateway's confirmation that a
 * `devices.gateway.commands` relay actually landed on the device. `key`/`value` are the channel and
 * the actuator state the gateway applied (e.g. `{ key: "relay1", value: "ON" }`); `status` is
 * `"ok"` or `"error"` (with `error` then carrying a message describing what went wrong); `topic`
 * echoes the device's own downlink MQTT topic the command was relayed to when the gateway resolved
 * one from an explicit relay topic — omitted when it instead fell back to resolving via
 * boot-config. Keyed/partitioned by `deviceId` like the other topics.
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

/**
 * Shared Kafka topic for gateway/device -> backend OTA update progress/result uplink — the
 * counterpart of the `ota_update` message on `KAFKA_GATEWAY_COMMANDS_TOPIC` (see its doc comment).
 * Each message carries `{ deviceId, status, version?, progress?, error? }`, keyed/partitioned by
 * deviceId like the other topics. `status` is one of `DeviceOtaStatus` (`"DOWNLOADING"`,
 * `"INSTALLING"`, `"SUCCESS"`, `"FAILED"`); `version` (on `"SUCCESS"`) is the firmware version now
 * running; `progress` is 0-100; `error` (on `"FAILED"`) describes what went wrong. Consumed by
 * `KafkaConsumerService.handleOtaStatus` -> `DeviceOtaService.handleOtaStatusReport`.
 */
export const KAFKA_OTA_STATUS_TOPIC = 'devices.cloud.ota';
