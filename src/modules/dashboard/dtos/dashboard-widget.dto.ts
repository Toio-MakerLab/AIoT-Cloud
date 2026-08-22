import { WidgetType } from '../../../constants/widget-type.ts';
import { EnumField, NumberField, StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';

export class DashboardWidgetDto {
  @StringField()
  id!: string;

  /** References DeviceEntity.id (not the physical/QR deviceId). */
  @StringField()
  deviceId!: string;

  @EnumField(() => WidgetType)
  widgetType!: WidgetType;

  @StringFieldOptional()
  field?: string;

  @StringFieldOptional()
  title?: string;

  @NumberField({ int: true })
  x!: number;

  @NumberField({ int: true })
  y!: number;

  @NumberField({ int: true })
  w!: number;

  @NumberField({ int: true })
  h!: number;
}
