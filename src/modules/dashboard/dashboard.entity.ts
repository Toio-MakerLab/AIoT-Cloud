import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { DashboardDto } from './dtos/dashboard.dto.ts';
import type { DashboardWidgetDto } from './dtos/dashboard-widget.dto.ts';

@Entity({ name: 'dashboards' })
@UseDto(DashboardDto)
export class DashboardEntity extends AbstractEntity<DashboardDto> {
  @Column({ type: 'varchar' })
  userId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  widgets!: DashboardWidgetDto[];
}
