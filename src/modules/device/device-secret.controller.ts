import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
import type { CreatedDeviceSecret } from './device-secret.service.ts';
import { DeviceSecretService } from './device-secret.service.ts';
import type { CreateDeviceSecretDto } from './dtos/create-device-secret.dto.ts';
import type { DeviceSecretDto } from './dtos/device-secret.dto.ts';

/** Manages the shared secrets accepted on the `x-device-secret` header — admin-only. */
@Controller('device-secrets')
@ApiTags('device-secrets')
export class DeviceSecretController {
  constructor(private deviceSecretService: DeviceSecretService) {}

  @Get()
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  list(): Promise<ResponseCore<DeviceSecretDto[]>> {
    return this.deviceSecretService.list();
  }

  @Post()
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.CREATED)
  create(@AuthUser() user: UserEntity, @Body() dto: CreateDeviceSecretDto): Promise<ResponseCore<CreatedDeviceSecret>> {
    return this.deviceSecretService.create(user.id as string, dto);
  }

  @Post(':id/revoke')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  revoke(@Param('id') id: string): Promise<ResponseCore<DeviceSecretDto>> {
    return this.deviceSecretService.revoke(id);
  }
}
