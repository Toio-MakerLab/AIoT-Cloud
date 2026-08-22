import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { DateField, StringField } from '../../../decorators/field.decorators.ts';
import type { DeviceTelemetryEntity } from '../device-telemetry.entity.ts';

export class DeviceTelemetryDto extends AbstractDto {
  @StringField()
  deviceId!: string;

  payload!: Record<string, unknown>;

  @DateField()
  recordedAt!: Date;

  constructor(entity: DeviceTelemetryEntity) {
    super(entity);
    this.deviceId = entity.deviceId;
    this.payload = entity.payload;
    this.recordedAt = entity.recordedAt;
  }
}
