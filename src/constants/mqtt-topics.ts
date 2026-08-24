/**
 * Central definition of the per-device MQTT topic roles used across the platform:
 * - telemetry: device -> backend (sensor readings, ingested into recordTelemetry)
 * - command:   backend -> device (downlink control messages; device subscribes)
 * - status:    device -> backend (online/offline / LWT announcements)
 * Keeping the templates + parsing regexes here means the ingestion controller,
 * the boot-config default, and any future publisher all agree on the same shape.
 */
export const defaultTelemetryTopic = (deviceId: string): string => `devices/${deviceId}/telemetry`;
export const defaultCommandTopic = (deviceId: string): string => `devices/${deviceId}/command`;
export const defaultStatusTopic = (deviceId: string): string => `devices/${deviceId}/status`;

export const TELEMETRY_TOPIC_REGEX = /^devices\/([^/]+)\/telemetry$/;
export const COMMAND_TOPIC_REGEX = /^devices\/([^/]+)\/command$/;
export const STATUS_TOPIC_REGEX = /^devices\/([^/]+)\/status$/;
