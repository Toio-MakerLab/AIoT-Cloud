import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { DevicePushChannel } from '../../../constants/device-push-channel.ts';
import { DeviceStatus } from '../../../constants/device-status.ts';
import { BooleanField, ClassFieldOptional, DateFieldOptional, EnumField, StringField } from '../../../decorators/field.decorators.ts';
import { DeviceTemplateDto } from '../../device-template/dtos/device-template.dto.ts';
import type { DeviceEntity } from '../device.entity.ts';
import type { DeviceNetworkConfig, DeviceWarningOverrides } from '../interfaces/device-network-config.interface.ts';

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
    this.config = entity.config;
    this.isActive = entity.isActive;
    this.warningOverrides = entity.warningOverrides;
  }
}
