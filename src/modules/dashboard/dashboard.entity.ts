import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { DashboardDto } from './dtos/dashboard.dto.ts';
import type { DashboardWidgetDto } from './dtos/dashboard-widget.dto.ts';

@Entity({ name: 'dashboards' })
@UseDto(DashboardDto)
export class DashboardEntity extends AbstractEntity<DashboardDto> {
  @Column({ type: 'varchar' })
  userId!: string;

  /** The factory this dashboard belongs to (copied from the creating user's `factoryId`) — lets
   * every account in the same factory read this dashboard, not just its literal owner. */
  @Index()
  @Column({ nullable: true, type: 'varchar' })
  factoryId!: string | null;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  widgets!: DashboardWidgetDto[];
}
