import { BooleanFieldOptional, StringField } from '../../../decorators/field.decorators.ts';

export class RegisterDeviceDto {
  @StringField()
  deviceId!: string;

  @StringField()
  templateId!: string;

  @StringField()
  name!: string;

  @BooleanFieldOptional()
  isActive?: boolean;
}
