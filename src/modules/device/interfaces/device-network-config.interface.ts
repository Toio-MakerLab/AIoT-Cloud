/** One downlink topic for a single channel of a multi-channel device (e.g. one relay). */
export interface DeviceMqttChannelTopic {
  /** 1-based channel number, matching the order of the template's `actionSchema`. */
  index: number;
  /** The action key from the device template's `actionSchema` (e.g. "relay1"). */
  key: string;
  label: string;
  topic: string;
}

export interface DeviceMqttTopics {
  telemetry: string;
  command?: string | null;
  status?: string | null;
  /** Auto-generated per-channel command topics; present only for multi-channel templates (e.g. RELAY_NODE). */
  channels?: DeviceMqttChannelTopic[] | null;
}

export interface DeviceMqttConfig {
  broker: string;
  port: number;
  username?: string | null;
  password?: string | null;
  topics: DeviceMqttTopics;
}

export interface DeviceHttpPushConfig {
  url: string;
  headers?: Record<string, string> | null;
}

export interface DeviceKafkaConfig {
  /** Comma-separated list of broker addresses, e.g. "broker1:9092,broker2:9092". */
  brokers: string;
  topic: string;
  clientId?: string | null;
  /** SASL credentials, only needed when overriding the platform's default Kafka broker/auth. */
  username?: string | null;
  password?: string | null;
}

export interface DeviceNetworkConfig {
  apiEndpoint?: string | null;
  mqtt?: DeviceMqttConfig | null;
  http?: DeviceHttpPushConfig | null;
  kafka?: DeviceKafkaConfig | null;
}

/** Per-device override of a template's default warning band for one telemetry field key. */
export interface DeviceWarningThreshold {
  min?: number;
  max?: number;
  enabled?: boolean;
}

export type DeviceWarningOverrides = Record<string, DeviceWarningThreshold>;
