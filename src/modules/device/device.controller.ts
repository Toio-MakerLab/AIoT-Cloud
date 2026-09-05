import type { MessageEvent } from '@nestjs/common';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Sse, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Observable } from 'rxjs';

import { resolveAccessScope } from '../../common/access-scope.util.ts';
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

  @Get()
  @Auth([RoleType.GUEST, RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  @ApiPageResponse({ description: 'Get my devices list', type: PageDto })
  getDevices(
    @AuthUser() user: UserEntity,
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: DevicesPageOptionsDto,
  ): Promise<PageDto<DeviceDto>> {
    return this.deviceService.getUserDevices(resolveAccessScope(user), pageOptionsDto);
  }

  @Post('register')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.CREATED)
  registerDevice(@AuthUser() user: UserEntity, @Body() dto: RegisterDeviceDto): Promise<ResponseCore<RegisterDeviceResult>> {
    return this.deviceService.registerDevice(user.id as string, user.factoryId, dto);
  }

  @Get('unclaimed')
  @Auth([RoleType.GUEST, RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getUnclaimedDevices(@Query('includeIgnored') includeIgnored?: string): Promise<ResponseCore<UnclaimedDeviceDto[]>> {
    return this.deviceService.listUnclaimedDevices(includeIgnored === 'true');
  }

  /** Dismisses noise (e.g. another system's devices sharing the broker) from the default unclaimed listing. */
  @Patch('unclaimed/:deviceId/ignore')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  ignoreUnclaimedDevice(@Param('deviceId') deviceId: string): Promise<ResponseCore<UnclaimedDeviceDto>> {
    return this.deviceService.ignoreUnclaimedDevice(deviceId);
  }

  @Delete('unclaimed/:deviceId/ignore')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  unignoreUnclaimedDevice(@Param('deviceId') deviceId: string): Promise<ResponseCore<UnclaimedDeviceDto>> {
    return this.deviceService.unignoreUnclaimedDevice(deviceId);
  }

  /**
   * Server-Sent Events feed for the dashboard: streams `telemetry`, `status`, `channelState`, and
   * `actionResult` events (plus a periodic `ping` heartbeat) for the devices listed in `ids`,
   * filtered to ones the user owns (or, for GUEST, unfiltered — every device system-wide).
   * `channelState`/`actionResult` fire whenever a relay/channel state changes (a `devices.cloud.events`
   * message applied via `DeviceService.handleDeviceChannelEvent`) — the SSE-transport counterpart
   * of what `AppGateway` forwards over socket.io.
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

    return this.deviceService.streamDeviceEvents(resolveAccessScope(user), deviceIds);
  }

  @Get(':id')
  @Auth([RoleType.GUEST, RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getDevice(@AuthUser() user: UserEntity, @Param('id') id: string): Promise<ResponseCore<DeviceDto>> {
    return this.deviceService.getDevice(resolveAccessScope(user), id);
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
    return this.deviceService.getDeviceTelemetryHistory(resolveAccessScope(user), id, query.limit, { from: query.from, to: query.to });
  }

  @Patch(':id/config')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  updateDeviceConfig(@AuthUser() user: UserEntity, @Param('id') id: string, @Body() dto: UpdateDeviceConfigDto): Promise<ResponseCore<DeviceDto>> {
    return this.deviceService.updateDeviceConfig(user.id as string, id, dto);
  }

  /** Nudges the device (typically a GATEWAY) to re-fetch its boot-config now instead of waiting for its own poll/reboot cycle. */
  @Post(':id/config/push')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  pushConfigSync(
    @AuthUser() user: UserEntity,
    @Param('id') id: string,
  ): Promise<ResponseCore<{ topic: string; configVersion: number; publishedAt: Date }>> {
    return this.deviceService.pushConfigSync(user.id as string, id);
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
