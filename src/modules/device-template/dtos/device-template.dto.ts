import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { DeviceTemplateType } from '../../../constants/device-template-type.ts';
import { BooleanField, EnumField, StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';
import type { ActionFieldDefinition, DeviceTemplateEntity, TelemetryFieldDefinition } from '../device-template.entity.ts';

export class DeviceTemplateDto extends AbstractDto {
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

  telemetrySchema?: TelemetryFieldDefinition[] | null;

  actionSchema?: ActionFieldDefinition[] | null;

  @BooleanField()
  isActive!: boolean;

  constructor(entity: DeviceTemplateEntity) {
    super(entity);
    this.name = entity.name;
    this.type = entity.type;
    this.description = entity.description;
    this.manufacturer = entity.manufacturer;
    this.icon = entity.icon;
    this.telemetrySchema = entity.telemetrySchema;
    this.actionSchema = entity.actionSchema;
    this.isActive = entity.isActive;
  }
}
