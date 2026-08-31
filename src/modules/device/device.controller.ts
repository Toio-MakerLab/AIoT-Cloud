import type { MessageEvent } from '@nestjs/common';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Sse, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Observable } from 'rxjs';

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
import type { UnclaimedDeviceDto } from './dtos/unclaimed-device.dto.ts';

@Controller('devices')
@ApiTags('devices')
export class DeviceController {
  constructor(private deviceService: DeviceService) {}

  /** GUEST sees every device system-wide, not just their own — `null` tells the service to skip the ownership filter. */
  private resolveOwnerId(user: UserEntity): string | null {
    return user.role === RoleType.GUEST ? null : (user.id as string);
  }

  @Get()
  @Auth([RoleType.GUEST, RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  @ApiPageResponse({ description: 'Get my devices list', type: PageDto })
  getDevices(
    @AuthUser() user: UserEntity,
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: DevicesPageOptionsDto,
  ): Promise<PageDto<DeviceDto>> {
    return this.deviceService.getUserDevices(this.resolveOwnerId(user), pageOptionsDto);
  }

  @Post('register')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.CREATED)
  registerDevice(@AuthUser() user: UserEntity, @Body() dto: RegisterDeviceDto): Promise<ResponseCore<RegisterDeviceResult>> {
    return this.deviceService.registerDevice(user.id as string, dto);
  }

  @Get('unclaimed')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getUnclaimedDevices(): Promise<ResponseCore<UnclaimedDeviceDto[]>> {
    return this.deviceService.listUnclaimedDevices();
  }

  /**
   * Server-Sent Events feed for the dashboard: streams `telemetry` and `status` events (plus a
   * periodic `ping` heartbeat) for the devices listed in `ids`, filtered to ones the user owns
   * (or, for GUEST, unfiltered — every device system-wide).
   * `ids` is a comma-separated list of device ids (same ids `GET /devices/:id` uses).
   */
  @Sse('stream')
  @Auth([RoleType.GUEST, RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  streamDeviceEvents(@AuthUser() user: UserEntity, @Query('ids') ids?: string): Observable<MessageEvent> {
    const deviceIds =
      ids
        ?.split(',')
        .map((id) => id.trim())
        .filter(Boolean) ?? [];

    return this.deviceService.streamDeviceEvents(this.resolveOwnerId(user), deviceIds);
  }

  @Get(':id')
  @Auth([RoleType.GUEST, RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getDevice(@AuthUser() user: UserEntity, @Param('id') id: string): Promise<ResponseCore<DeviceDto>> {
    return this.deviceService.getDevice(this.resolveOwnerId(user), id);
  }

  @Delete(':id')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  deleteDevice(@AuthUser() user: UserEntity, @Param('id') id: string): Promise<ResponseCore<null>> {
    return this.deviceService.deleteDevice(user.id as string, id);
  }

  @Get(':id/telemetry')
  @Auth([RoleType.GUEST, RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getDeviceTelemetry(
    @AuthUser() user: UserEntity,
    @Param('id') id: string,
    @Query(new ValidationPipe({ transform: true })) query: DeviceTelemetryQueryDto,
  ): Promise<ResponseCore<DeviceTelemetryDto[]>> {
    return this.deviceService.getDeviceTelemetryHistory(this.resolveOwnerId(user), id, query.limit);
  }

  @Patch(':id/config')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  updateDeviceConfig(@AuthUser() user: UserEntity, @Param('id') id: string, @Body() dto: UpdateDeviceConfigDto): Promise<ResponseCore<DeviceDto>> {
    return this.deviceService.updateDeviceConfig(user.id as string, id, dto);
  }

  @Post(':id/actions')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  triggerDeviceAction(
    @AuthUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: TriggerDeviceActionDto,
  ): Promise<ResponseCore<{ key: string; value: string; topic: string; publishedAt: Date }>> {
    return this.deviceService.triggerDeviceAction(user.id as string, id, dto);
  }
}
