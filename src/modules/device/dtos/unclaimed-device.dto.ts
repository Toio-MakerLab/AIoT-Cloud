import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { DateField, StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';
import type { UnclaimedDeviceEntity } from '../unclaimed-device.entity.ts';

export class UnclaimedDeviceDto extends AbstractDto {
  @StringField()
  deviceId!: string;

  @StringField()
  lastTopic!: string;

  @StringFieldOptional({ nullable: true })
  lastPayload!: string | null;

  @DateField()
  lastSeenAt!: Date;

  constructor(entity: UnclaimedDeviceEntity) {
    super(entity);
    this.deviceId = entity.deviceId;
    this.lastTopic = entity.lastTopic;
    this.lastPayload = entity.lastPayload;
    this.lastSeenAt = entity.lastSeenAt;
  }
}
