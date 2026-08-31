import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import type { AccessScope } from '../../common/access-scope.util.ts';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import { DashboardEntity } from './dashboard.entity.ts';
import type { DashboardDto } from './dtos/dashboard.dto.ts';
import type { SaveDashboardDto } from './dtos/save-dashboard.dto.ts';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(DashboardEntity)
    private dashboardRepository: Repository<DashboardEntity>,
  ) {}

  /** `scope: null` means unrestricted (GUEST) — every dashboard system-wide, not just the caller's own. */
  async getUserDashboards(scope: AccessScope): Promise<DashboardDto[]> {
    const entities = await this.dashboardRepository.find({ where: scope ?? {}, order: { createdAt: 'ASC' } });

    return entities.toDtos();
  }

  /** `scope: null` means unrestricted (GUEST) — can look up any dashboard, not just the caller's own. */
  async getDashboard(scope: AccessScope, id: string): Promise<ResponseCore<DashboardDto>> {
    const entity = await this.dashboardRepository.findOneBy(scope ? { id, ...scope } : { id });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.dashboardNotFound');
    }

    return ResponseCore.ok(entity.toDto());
  }

  /** `factoryId` is copied from the creating user's own `UserEntity.factoryId`, so the dashboard
   * follows its owner's factory and becomes readable by the whole factory, not just its owner. */
  @Transactional()
  async createDashboard(userId: string, factoryId: string | null, dto: SaveDashboardDto): Promise<ResponseCore<DashboardDto>> {
    const entity = this.dashboardRepository.create({
      userId,
      factoryId,
      name: dto.name,
      isDefault: dto.isDefault ?? false,
      widgets: dto.widgets ?? [],
    });

    await this.dashboardRepository.save(entity);

    return ResponseCore.ok(entity.toDto());
  }

  @Transactional()
  async updateDashboard(userId: string, id: string, dto: SaveDashboardDto): Promise<ResponseCore<DashboardDto>> {
    const entity = await this.dashboardRepository.findOneBy({ id, userId });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.dashboardNotFound');
    }

    entity.name = dto.name;
    entity.isDefault = dto.isDefault ?? entity.isDefault;
    entity.widgets = dto.widgets ?? entity.widgets;

    await this.dashboardRepository.save(entity);

    return ResponseCore.ok(entity.toDto());
  }

  @Transactional()
  async deleteDashboard(userId: string, id: string): Promise<ResponseCore<null>> {
    const entity = await this.dashboardRepository.findOneBy({ id, userId });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.dashboardNotFound');
    }

    await this.dashboardRepository.remove(entity);

    return ResponseCore.ok(null);
  }
}
