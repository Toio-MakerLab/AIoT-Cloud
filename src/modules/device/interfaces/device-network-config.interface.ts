import type { NotificationChannelType } from '../../../constants/notification-channel-type.ts';

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
  /** Topics this device (typically a gateway) produces to — e.g. telemetry, status, events. */
  topics: string[];
  /**
   * Topic the cloud publishes to for sending events/commands down to this device — only set for
   * gateways, since they're the ones that consume it and relay to the devices they bridge (see
   * `KAFKA_COMMAND_TOPIC`). Not part of `topics` above since that list is produce-only.
   */
  commandTopic?: string | null;
  /**
   * Unique producer clientId registered for this device/gateway, so every message it sends to
   * Kafka is attributable to it specifically rather than sharing the platform's default clientId
   * across every gateway. Generated once on first boot-config fetch and persisted from then on.
   */
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
  /** Notification channels this gate fans out to; omitted/empty falls back to all enabled+linked channels. */
  channels?: NotificationChannelType[];
}

export type DeviceWarningOverrides = Record<string, DeviceWarningThreshold>;
