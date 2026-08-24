import { DevicePushChannel } from '../../../constants/device-push-channel.ts';
import {
  ClassField,
  ClassFieldOptional,
  EnumFieldOptional,
  NumberField,
  StringField,
  StringFieldOptional,
  URLField,
  URLFieldOptional,
} from '../../../decorators/field.decorators.ts';
import type { DeviceHttpPushConfig, DeviceKafkaConfig, DeviceMqttConfig, DeviceMqttTopics } from '../interfaces/device-network-config.interface.ts';

/**
 * telemetry: device -> backend (ingested via recordTelemetry)
 * command:   backend -> device (downlink; device subscribes)
 * status:    device -> backend (online/offline / LWT announcements)
 */
export class MqttTopicsDto implements DeviceMqttTopics {
  @StringField()
  telemetry!: string;

  @StringFieldOptional({ nullable: true })
  command?: string | null;

  @StringFieldOptional({ nullable: true })
  status?: string | null;
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

  @StringField()
  topic!: string;

  @StringFieldOptional({ nullable: true })
  clientId?: string | null;
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
}

/** Response for the ESP32 boot-config endpoint — never includes the device secret. */
export class DeviceConfigDto {
  deviceId!: string;
  apiEndpoint!: string | null;
  pushChannel!: DevicePushChannel;
  mqtt!: DeviceMqttConfig | null;
  http!: DeviceHttpPushConfig | null;
  kafka!: DeviceKafkaConfig | null;
  configVersion!: number;
}
