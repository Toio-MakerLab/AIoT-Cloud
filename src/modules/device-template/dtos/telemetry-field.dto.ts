import { StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';

export class TelemetryFieldDto {
  @StringField()
  key!: string;

  @StringField()
  label!: string;

  @StringFieldOptional()
  unit?: string;
}
