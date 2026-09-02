import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { resolveAccessScope } from '../../common/access-scope.util.ts';
import type { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { DeviceLifecycleService } from './device-lifecycle.service.ts';
import type { DeviceLifecycleAssessmentDto } from './dtos/device-lifecycle.dto.ts';
import { UpdateDeviceLifecycleDto } from './dtos/device-lifecycle.dto.ts';

@Controller('devices/:id/lifecycle')
@ApiTags('devices')
export class DeviceLifecycleController {
  constructor(private deviceLifecycleService: DeviceLifecycleService) {}

  /** Recomputes the device's lifecycle score/stage on demand and persists the fresher result. */
  @Get()
  @Auth([RoleType.GUEST, RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getAssessment(@AuthUser() user: UserEntity, @Param('id') id: string): Promise<ResponseCore<DeviceLifecycleAssessmentDto>> {
    return this.deviceLifecycleService.getAssessment(resolveAccessScope(user), id);
  }

  /** Sets the install date and/or expected lifespan the age factor is computed from. */
  @Patch()
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  updateConfig(
    @AuthUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: UpdateDeviceLifecycleDto,
  ): Promise<ResponseCore<DeviceLifecycleAssessmentDto>> {
    return this.deviceLifecycleService.updateConfig(user.id as string, id, dto);
  }

  /** Manually retires the device; its stage stops recomputing from telemetry/connectivity after this. */
  @Post('decommission')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  decommission(@AuthUser() user: UserEntity, @Param('id') id: string): Promise<ResponseCore<DeviceLifecycleAssessmentDto>> {
    return this.deviceLifecycleService.decommission(user.id as string, id);
  }
}
