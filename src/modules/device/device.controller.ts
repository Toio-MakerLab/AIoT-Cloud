import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PageDto } from '../../common/dto/page.dto.ts';
import type { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { ApiPageResponse } from '../../decorators/api-page-response.decorator.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
import type { RegisterDeviceResult } from './device.service.ts';
import { DeviceService } from './device.service.ts';
import type { DeviceDto } from './dtos/device.dto.ts';
import { UpdateDeviceConfigDto } from './dtos/device-config.dto.ts';
import type { DeviceTelemetryDto } from './dtos/device-telemetry.dto.ts';
import { DeviceTelemetryQueryDto } from './dtos/device-telemetry-query.dto.ts';
import { DevicesPageOptionsDto } from './dtos/devices-page-options.dto.ts';
import { RegisterDeviceDto } from './dtos/register-device.dto.ts';
import { TriggerDeviceActionDto } from './dtos/trigger-device-action.dto.ts';

@Controller('devices')
@ApiTags('devices')
export class DeviceController {
  constructor(private deviceService: DeviceService) {}

  @Get()
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  @ApiPageResponse({ description: 'Get my devices list', type: PageDto })
  getDevices(
    @AuthUser() user: UserEntity,
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: DevicesPageOptionsDto,
  ): Promise<PageDto<DeviceDto>> {
    return this.deviceService.getUserDevices(user.id as Uuid, pageOptionsDto);
  }

  @Post('register')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.CREATED)
  registerDevice(@AuthUser() user: UserEntity, @Body() dto: RegisterDeviceDto): Promise<ResponseCore<RegisterDeviceResult>> {
    return this.deviceService.registerDevice(user.id as Uuid, dto);
  }

  @Get(':id')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getDevice(@AuthUser() user: UserEntity, @Param('id') id: Uuid): Promise<ResponseCore<DeviceDto>> {
    return this.deviceService.getDevice(user.id as Uuid, id);
  }

  @Delete(':id')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  deleteDevice(@AuthUser() user: UserEntity, @Param('id') id: Uuid): Promise<ResponseCore<null>> {
    return this.deviceService.deleteDevice(user.id as Uuid, id);
  }

  @Get(':id/telemetry')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getDeviceTelemetry(
    @AuthUser() user: UserEntity,
    @Param('id') id: Uuid,
    @Query(new ValidationPipe({ transform: true })) query: DeviceTelemetryQueryDto,
  ): Promise<ResponseCore<DeviceTelemetryDto[]>> {
    return this.deviceService.getDeviceTelemetryHistory(user.id as Uuid, id, query.limit);
  }

  @Patch(':id/config')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  updateDeviceConfig(@AuthUser() user: UserEntity, @Param('id') id: Uuid, @Body() dto: UpdateDeviceConfigDto): Promise<ResponseCore<DeviceDto>> {
    return this.deviceService.updateDeviceConfig(user.id as Uuid, id, dto);
  }

  @Post(':id/actions')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  triggerDeviceAction(
    @AuthUser() user: UserEntity,
    @Param('id') id: Uuid,
    @Body() dto: TriggerDeviceActionDto,
  ): Promise<ResponseCore<{ key: string; value: string; topic: string; publishedAt: Date }>> {
    return this.deviceService.triggerDeviceAction(user.id as Uuid, id, dto);
  }
}
