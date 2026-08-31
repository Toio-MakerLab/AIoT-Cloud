import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

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

  /** `userId: null` means unrestricted (GUEST) — every dashboard system-wide, not just the caller's own. */
  async getUserDashboards(userId: string | null): Promise<DashboardDto[]> {
    const entities = await this.dashboardRepository.find({ where: userId ? { userId } : {}, order: { createdAt: 'ASC' } });

    return entities.toDtos();
  }

  /** `userId: null` means unrestricted (GUEST) — can look up any dashboard, not just the caller's own. */
  async getDashboard(userId: string | null, id: string): Promise<ResponseCore<DashboardDto>> {
    const entity = await this.dashboardRepository.findOneBy(userId ? { id, userId } : { id });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.dashboardNotFound');
    }

    return ResponseCore.ok(entity.toDto());
  }

  @Transactional()
  async createDashboard(userId: string, dto: SaveDashboardDto): Promise<ResponseCore<DashboardDto>> {
    const entity = this.dashboardRepository.create({
      userId,
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
