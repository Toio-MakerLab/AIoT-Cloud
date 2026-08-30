import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { decodeBase64 } from '../../../common/utils.ts';
import { DevicePushChannel } from '../../../constants/device-push-channel.ts';
import { DeviceStatus } from '../../../constants/device-status.ts';
import { BooleanField, ClassFieldOptional, DateFieldOptional, EnumField, StringField } from '../../../decorators/field.decorators.ts';
import { DeviceTemplateDto } from '../../device-template/dtos/device-template.dto.ts';
import type { DeviceEntity } from '../device.entity.ts';
import type {
  DeviceAlertRule,
  DeviceFailsafeConfig,
  DeviceNetworkConfig,
  DeviceOfflineAlertConfig,
  DeviceWarningOverrides,
} from '../interfaces/device-network-config.interface.ts';

export class DeviceDto extends AbstractDto {
  @StringField()
  deviceId!: string;

  @StringField()
  name!: string;

  @StringField()
  templateId!: string;

  @ClassFieldOptional(() => DeviceTemplateDto)
  template?: DeviceTemplateDto;

  @StringField()
  userId!: string;

  @DateFieldOptional({ nullable: true })
  lastSeenAt?: Date | null;

  @EnumField(() => DeviceStatus)
  status!: DeviceStatus;

  @EnumField(() => DevicePushChannel)
  pushChannel!: DevicePushChannel;

  /** Non-secret network config — device secret hash never leaves the entity. */
  config?: DeviceNetworkConfig | null;

  @BooleanField()
  isActive!: boolean;

  warningOverrides?: DeviceWarningOverrides | null;

  channelStates?: Record<string, string> | null;

  offlineAlert?: DeviceOfflineAlertConfig | null;

  alertRules?: DeviceAlertRule[] | null;

  failsafe?: DeviceFailsafeConfig | null;

  constructor(entity: DeviceEntity) {
    super(entity);
    this.deviceId = entity.deviceId;
    this.name = entity.name;
    this.templateId = entity.templateId;
    this.template = entity.template?.toDto();
    this.userId = entity.userId;
    this.lastSeenAt = entity.lastSeenAt;
    this.status = entity.status;
    this.pushChannel = entity.pushChannel;
    // Broker passwords are stored base64-encoded (see DeviceService.updateDeviceConfig) — decode
    // back to plaintext here so the admin dashboard's edit form pre-fills the real password
    // instead of the encoded blob (which would otherwise get double-encoded on the next save).
    this.config = entity.config && {
      ...entity.config,
      mqtt: entity.config.mqtt && { ...entity.config.mqtt, password: entity.config.mqtt.password},
      kafka: entity.config.kafka && { ...entity.config.kafka, password: decodeBase64(entity.config.kafka.password) },
    };
    this.isActive = entity.isActive;
    this.warningOverrides = entity.warningOverrides;
    this.channelStates = entity.channelStates;
    this.offlineAlert = entity.offlineAlert;
    this.alertRules = entity.alertRules;
    this.failsafe = entity.failsafe;
  }
}
