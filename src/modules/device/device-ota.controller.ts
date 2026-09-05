import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { resolveAccessScope } from '../../common/access-scope.util.ts';
import type { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { DeviceOtaService } from './device-ota.service.ts';
import type { DeviceOtaStatusDto, DeviceOtaUpdateDto } from './dtos/device-ota.dto.ts';
import { TriggerOtaUpdateDto } from './dtos/device-ota.dto.ts';

@Controller('devices/:id/ota')
@ApiTags('devices')
export class DeviceOtaController {
  constructor(private deviceOtaService: DeviceOtaService) {}

  /** Current (or most recently completed) OTA attempt for this device — see DeviceOtaService.getStatus. */
  @Get()
  @Auth([RoleType.GUEST, RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getStatus(@AuthUser() user: UserEntity, @Param('id') id: string): Promise<ResponseCore<DeviceOtaStatusDto>> {
    return this.deviceOtaService.getStatus(resolveAccessScope(user), id);
  }

  @Get('history')
  @Auth([RoleType.GUEST, RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getHistory(@AuthUser() user: UserEntity, @Param('id') id: string): Promise<ResponseCore<DeviceOtaUpdateDto[]>> {
    return this.deviceOtaService.getHistory(resolveAccessScope(user), id);
  }

  /** Dispatches an update to the device from the firmware catalog — see DeviceOtaService.triggerUpdate. */
  @Post()
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  triggerUpdate(@AuthUser() user: UserEntity, @Param('id') id: string, @Body() dto: TriggerOtaUpdateDto): Promise<ResponseCore<DeviceOtaStatusDto>> {
    return this.deviceOtaService.triggerUpdate(user.id as string, id, dto);
  }
}
