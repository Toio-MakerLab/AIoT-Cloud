/**
 * Central definition of the per-device MQTT topic roles used across the platform:
 * - telemetry: device -> backend (sensor readings, ingested into recordTelemetry)
 * - command:   backend -> device (downlink control messages; device subscribes)
 * - status:    device -> backend (online/offline / LWT announcements)
 * - event:     device -> backend (command-result ack; see below)
 * Keeping the templates + parsing regexes here means the ingestion controller,
 * the boot-config default, and any future publisher all agree on the same shape.
 */
export const defaultTelemetryTopic = (deviceId: string): string => `devices/${deviceId}/telemetry`;
export const defaultCommandTopic = (deviceId: string): string => `devices/${deviceId}/command`;
export const defaultStatusTopic = (deviceId: string): string => `devices/${deviceId}/status`;

/**
 * Uplink ack topic for a downlink command: mirrors the Kafka `devices.events` shape
 * (`{ key, value, status, error? }`) so `MqttController` can hand both off to the same
 * `DeviceService.handleDeviceChannelEvent`. A device that applied a command publishes here to
 * confirm (or report failure) instead of the backend only ever trusting its own optimistic update.
 */
export const defaultEventTopic = (deviceId: string): string => `devices/${deviceId}/event`;

/**
 * Per-channel downlink topic for multi-channel devices (e.g. a relay node with N relays).
 * Channel numbers are 1-based and follow the order of the device template's `actionSchema`.
 */
export const defaultChannelCommandTopic = (deviceId: string, channel: number): string => `devices/${deviceId}/channel/${channel}/command`;

/** Downlink OTA update instruction: backend -> device, `{ version, url, checksum?, size? }` — see DeviceOtaService.triggerUpdate. */
export const defaultOtaTopic = (deviceId: string): string => `devices/${deviceId}/ota`;

/** Uplink OTA progress/result report: device -> backend, `{ status, version?, progress?, error? }` — see DeviceOtaService.handleOtaStatusReport. */
export const defaultOtaStatusTopic = (deviceId: string): string => `devices/${deviceId}/ota/status`;

export const TELEMETRY_TOPIC_REGEX = /^devices\/([^/]+)\/telemetry$/;
export const COMMAND_TOPIC_REGEX = /^devices\/([^/]+)\/command$/;
export const STATUS_TOPIC_REGEX = /^devices\/([^/]+)\/status$/;
export const EVENT_TOPIC_REGEX = /^devices\/([^/]+)\/event$/;
export const CHANNEL_COMMAND_TOPIC_REGEX = /^devices\/([^/]+)\/channel\/(\d+)\/command$/;
export const OTA_TOPIC_REGEX = /^devices\/([^/]+)\/ota$/;
export const OTA_STATUS_TOPIC_REGEX = /^devices\/([^/]+)\/ota\/status$/;
