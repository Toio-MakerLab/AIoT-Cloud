import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { BooleanField, ClassField, StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';
import type { DashboardEntity } from '../dashboard.entity.ts';
import { DashboardWidgetDto } from './dashboard-widget.dto.ts';

export class DashboardDto extends AbstractDto {
  @StringField()
  userId!: string;

  @StringFieldOptional({ nullable: true })
  factoryId?: string | null;

  @StringField()
  name!: string;

  @BooleanField()
  isDefault!: boolean;

  @ClassField(() => DashboardWidgetDto, { each: true, isArray: true })
  widgets!: DashboardWidgetDto[];

  constructor(entity: DashboardEntity) {
    super(entity);
    this.userId = entity.userId;
    this.factoryId = entity.factoryId;
    this.name = entity.name;
    this.isDefault = entity.isDefault;
    this.widgets = entity.widgets;
  }
}
