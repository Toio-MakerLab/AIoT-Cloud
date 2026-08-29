/**
 * Web-side mirror of the backend's default MQTT topic naming (src/constants/mqtt-topics.ts).
 * Used purely to pre-fill the config form's topic inputs with the value the device will get
 * at boot if the user leaves them untouched — the backend remains the source of truth.
 */
export const defaultTelemetryTopic = (deviceId: string): string => `devices/${deviceId}/telemetry`;
export const defaultCommandTopic = (deviceId: string): string => `devices/${deviceId}/command`;
export const defaultStatusTopic = (deviceId: string): string => `devices/${deviceId}/status`;

/**
 * Per-channel downlink topic for multi-channel devices (e.g. a relay node with N relays).
 * Channel numbers are 1-based and follow the order of the device template's `actionSchema`.
 */
export const defaultChannelCommandTopic = (deviceId: string, channel: number): string => `devices/${deviceId}/channel/${channel}/command`;
