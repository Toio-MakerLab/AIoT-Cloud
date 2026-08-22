import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { DashboardService } from './dashboard.service.ts';
import type { DashboardDto } from './dtos/dashboard.dto.ts';
import { SaveDashboardDto } from './dtos/save-dashboard.dto.ts';

@Controller('dashboards')
@ApiTags('dashboards')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getDashboards(@AuthUser() user: UserEntity): Promise<DashboardDto[]> {
    return this.dashboardService.getUserDashboards(user.id as Uuid);
  }

  @Get(':id')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getDashboard(@AuthUser() user: UserEntity, @Param('id') id: Uuid): Promise<ResponseCore<DashboardDto>> {
    return this.dashboardService.getDashboard(user.id as Uuid, id);
  }

  @Post()
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.CREATED)
  createDashboard(@AuthUser() user: UserEntity, @Body() dto: SaveDashboardDto): Promise<ResponseCore<DashboardDto>> {
    return this.dashboardService.createDashboard(user.id as Uuid, dto);
  }

  @Put(':id')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  updateDashboard(@AuthUser() user: UserEntity, @Param('id') id: Uuid, @Body() dto: SaveDashboardDto): Promise<ResponseCore<DashboardDto>> {
    return this.dashboardService.updateDashboard(user.id as Uuid, id, dto);
  }

  @Delete(':id')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  deleteDashboard(@AuthUser() user: UserEntity, @Param('id') id: Uuid): Promise<ResponseCore<null>> {
    return this.dashboardService.deleteDashboard(user.id as Uuid, id);
  }
}
