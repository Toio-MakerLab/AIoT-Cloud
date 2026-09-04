import { DevicePushChannel } from '../../../constants/device-push-channel.ts';
import type { DeviceTemplateType } from '../../../constants/device-template-type.ts';
import { NotificationChannelType } from '../../../constants/notification-channel-type.ts';
import {
  BooleanField,
  BooleanFieldOptional,
  ClassField,
  ClassFieldOptional,
  EnumFieldOptional,
  NumberField,
  StringField,
  StringFieldOptional,
  URLField,
  URLFieldOptional,
} from '../../../decorators/field.decorators.ts';
import { IsNullable, IsUndefinable } from '../../../decorators/validator.decorators.ts';
import type {
  DeviceAlertRule,
  DeviceFailsafeConfig,
  DeviceHttpPushConfig,
  DeviceKafkaConfig,
  DeviceMqttChannelTopic,
  DeviceMqttConfig,
  DeviceMqttTopics,
  DeviceOfflineAlertConfig,
  DeviceWarningOverrides,
} from '../interfaces/device-network-config.interface.ts';

export class MqttChannelTopicDto implements DeviceMqttChannelTopic {
  @NumberField({ int: true, min: 1 })
  index!: number;

  @StringField()
  key!: string;

  @StringField()
  label!: string;

  @StringField()
  topic!: string;
}

/**
 * telemetry: device -> backend (ingested via recordTelemetry)
 * command:   backend -> device (downlink; device subscribes)
 * status:    device -> backend (online/offline / LWT announcements)
 * event:     device -> backend (ack for a downlink command; see defaultEventTopic)
 * channels:  backend -> device (per-channel downlink, auto-derived from the template's actionSchema)
 */
export class MqttTopicsDto implements DeviceMqttTopics {
  @StringField()
  telemetry!: string;

  @StringFieldOptional({ nullable: true })
  command?: string | null;

  @StringFieldOptional({ nullable: true })
  status?: string | null;

  @StringFieldOptional({ nullable: true })
  event?: string | null;

  @ClassFieldOptional(() => MqttChannelTopicDto, { nullable: true, each: true, isArray: true })
  channels?: MqttChannelTopicDto[] | null;
}

export class MqttConfigDto implements DeviceMqttConfig {
  @StringField()
  broker!: string;

  @NumberField({ int: true, min: 1, max: 65_535 })
  port!: number;

  @StringFieldOptional({ nullable: true })
  username?: string | null;

  @StringFieldOptional({ nullable: true })
  password?: string | null;

  @ClassField(() => MqttTopicsDto)
  topics!: MqttTopicsDto;
}

export class HttpPushConfigDto implements DeviceHttpPushConfig {
  @URLField()
  url!: string;

  headers?: Record<string, string> | null;
}

export class KafkaConfigDto implements DeviceKafkaConfig {
  @StringField()
  brokers!: string;

  @StringField({ each: true, isArray: true })
  topics!: string[];

  @StringFieldOptional({ nullable: true })
  commandTopic?: string | null;

  @StringFieldOptional({ nullable: true })
  clientId?: string | null;

  @StringFieldOptional({ nullable: true })
  username?: string | null;

  @StringFieldOptional({ nullable: true })
  password?: string | null;
}

export class OfflineAlertConfigDto implements DeviceOfflineAlertConfig {
  @BooleanField()
  enabled!: boolean;

  /** Unset/empty means "all of the user's enabled channels". */
  @EnumFieldOptional(() => NotificationChannelType, { nullable: true, each: true })
  channels?: NotificationChannelType[] | null;
}

export class FailsafeConfigDto implements DeviceFailsafeConfig {
  @BooleanField()
  enabled!: boolean;

  /** "<actionKey>=<actionValue>" shorthand, applied unconditionally once the gateway fails safe. */
  @StringFieldOptional({ nullable: true, each: true })
  rules?: string[] | null;
}

export class UpdateDeviceConfigDto {
  @URLFieldOptional({ nullable: true })
  apiEndpoint?: string | null;

  @EnumFieldOptional(() => DevicePushChannel)
  pushChannel?: DevicePushChannel;

  @ClassFieldOptional(() => MqttConfigDto, { nullable: true })
  mqtt?: MqttConfigDto | null;

  @ClassFieldOptional(() => HttpPushConfigDto, { nullable: true })
  http?: HttpPushConfigDto | null;

  @ClassFieldOptional(() => KafkaConfigDto, { nullable: true })
  kafka?: KafkaConfigDto | null;

  @BooleanFieldOptional()
  isActive?: boolean;

  /**
   * Per-field overrides of the template's default warning band; keyed by telemetry field key.
   * Dynamically keyed by whatever telemetry fields the device's template declares, so it can't be
   * validated as a fixed-shape nested DTO like the others below — just kept whitelist-safe.
   */
  @IsUndefinable()
  @IsNullable()
  warningOverrides?: DeviceWarningOverrides | null;

  /** Notify-on-offline rule — mainly for GATEWAY devices, which have no telemetrySchema of their own. */
  @ClassFieldOptional(() => OfflineAlertConfigDto, { nullable: true })
  offlineAlert?: OfflineAlertConfigDto | null;

  /**
   * Local automation rules a gateway caches and evaluates itself — each entry is
   * "<field><operator><threshold>:<actionKey>=<actionValue>", e.g. "amps.value>10:relay_2=OFF".
   * See DeviceAlertRule.
   */
  @StringFieldOptional({ nullable: true, each: true })
  alertRules?: DeviceAlertRule[] | null;

  /** Safe state a gateway falls back to on its own when it loses the cloud. */
  @ClassFieldOptional(() => FailsafeConfigDto, { nullable: true })
  failsafe?: FailsafeConfigDto | null;
}

/** Response for the ESP32 boot-config endpoint — never includes the device secret. */
export class DeviceConfigDto {
  deviceId!: string;
  name!: string;
  /** Device template type (e.g. RELAY_NODE) — lets firmware branch on behavior without a separate template lookup. */
  type!: DeviceTemplateType;
  apiEndpoint!: string | null;
  pushChannel!: DevicePushChannel;
  mqtt!: DeviceMqttConfig | null;
  http!: DeviceHttpPushConfig | null;
  kafka!: DeviceKafkaConfig | null;
  configVersion!: number;
  /** Notify-on-offline rule, if the device has one configured — see UpdateDeviceConfigDto.offlineAlert. */
  offlineAlert!: DeviceOfflineAlertConfig | null;
  /** Local automation rules for the gateway to cache and evaluate itself — see UpdateDeviceConfigDto.alertRules. */
  alertRules!: DeviceAlertRule[] | null;
  /** Safe state to fall back to when the gateway loses the cloud — see UpdateDeviceConfigDto.failsafe. */
  failsafe!: DeviceFailsafeConfig | null;
}
