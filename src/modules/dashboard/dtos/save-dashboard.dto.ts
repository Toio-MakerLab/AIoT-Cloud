import { BooleanFieldOptional, ClassFieldOptional, StringField } from '../../../decorators/field.decorators.ts';
import { DashboardWidgetDto } from './dashboard-widget.dto.ts';

export class SaveDashboardDto {
  @StringField()
  name!: string;

  @BooleanFieldOptional()
  isDefault?: boolean;

  @ClassFieldOptional(() => DashboardWidgetDto, { each: true, isArray: true })
  widgets?: DashboardWidgetDto[];
}
