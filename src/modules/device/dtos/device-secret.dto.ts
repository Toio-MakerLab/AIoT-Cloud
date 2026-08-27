import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { DateFieldOptional, StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';
import type { DeviceSecretEntity } from '../device-secret.entity.ts';

export class DeviceSecretDto extends AbstractDto {
  @StringFieldOptional({ nullable: true })
  label!: string | null;

  @StringField()
  createdByUserId!: string;

  @DateFieldOptional({ nullable: true })
  revokedAt!: Date | null;

  constructor(entity: DeviceSecretEntity) {
    super(entity);
    this.label = entity.label;
    this.createdByUserId = entity.createdByUserId;
    this.revokedAt = entity.revokedAt;
  }
}
