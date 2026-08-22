import { DeviceTemplateType } from '../../../constants/device-template-type.ts';
import { BooleanFieldOptional, ClassFieldOptional, EnumField, StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';
import { TelemetryFieldDto } from './telemetry-field.dto.ts';

export class CreateDeviceTemplateDto {
  @StringField()
  name!: string;

  @EnumField(() => DeviceTemplateType)
  type!: DeviceTemplateType;

  @StringFieldOptional({ nullable: true })
  description?: string | null;

  @StringFieldOptional({ nullable: true })
  manufacturer?: string | null;

  @StringFieldOptional({ nullable: true })
  icon?: string | null;

  @ClassFieldOptional(() => TelemetryFieldDto, { each: true, isArray: true })
  telemetrySchema?: TelemetryFieldDto[];

  @BooleanFieldOptional()
  isActive?: boolean;
}
