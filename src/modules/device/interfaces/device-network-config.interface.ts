export interface DeviceMqttTopics {
  telemetry: string;
  command?: string | null;
  status?: string | null;
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
}

export interface DeviceNetworkConfig {
  apiEndpoint?: string | null;
  mqtt?: DeviceMqttConfig | null;
  http?: DeviceHttpPushConfig | null;
  kafka?: DeviceKafkaConfig | null;
}
