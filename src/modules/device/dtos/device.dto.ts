import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { DevicePushChannel } from '../../../constants/device-push-channel.ts';
import { DeviceStatus } from '../../../constants/device-status.ts';
import { BooleanField, ClassFieldOptional, DateFieldOptional, EnumField, StringField } from '../../../decorators/field.decorators.ts';
import { DeviceTemplateDto } from '../../device-template/dtos/device-template.dto.ts';
import type { DeviceEntity } from '../device.entity.ts';
import type { DeviceNetworkConfig } from '../interfaces/device-network-config.interface.ts';

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

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

  constructor(entity: DeviceEntity) {
    super(entity);
    this.deviceId = entity.deviceId;
    this.name = entity.name;
    this.templateId = entity.templateId;
    this.template = entity.template?.toDto();
    this.userId = entity.userId;
    this.lastSeenAt = entity.lastSeenAt;
    this.status = entity.lastSeenAt && Date.now() - entity.lastSeenAt.getTime() < ONLINE_THRESHOLD_MS ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE;
    this.pushChannel = entity.pushChannel;
    this.config = entity.config;
    this.isActive = entity.isActive;
  }
}
