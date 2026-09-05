import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { CurrentDevice } from '../../decorators/current-device.decorator.ts';
import type { DeviceEntity } from './device.entity.ts';
import { DeviceService } from './device.service.ts';
import { DeviceOtaService } from './device-ota.service.ts';
import type { DeviceConfigDto } from './dtos/device-config.dto.ts';
import type { OtaManifestDto } from './dtos/device-ota.dto.ts';
import { DeviceSecretGuard } from './guards/device-secret.guard.ts';

/**
 * Endpoints called by device firmware (ESP32) itself, authenticated with a shared
 * secret header (same value for all devices) rather than a human JWT — kept separate
 * from `DeviceController`.
 */
@Controller('devices')
@ApiTags('devices')
export class DeviceProvisioningController {
  constructor(
    private deviceService: DeviceService,
    private deviceOtaService: DeviceOtaService,
  ) {}

  @Get(':deviceId/boot-config')
  @UseGuards(DeviceSecretGuard)
  @HttpCode(HttpStatus.OK)
  getBootConfig(@Param('deviceId') deviceId: string): Promise<ResponseCore<DeviceConfigDto>> {
    return this.deviceService.getBootConfig(deviceId);
  }

  /**
   * Pull-based OTA check: a device/gateway can poll this itself (boot, or on an interval) instead
   * of only ever reacting to a dashboard-initiated push — see `DeviceOtaService.getManifest`.
   */
  @Get(':deviceId/ota/manifest')
  @UseGuards(DeviceSecretGuard)
  @HttpCode(HttpStatus.OK)
  getOtaManifest(@Param('deviceId') deviceId: string): Promise<ResponseCore<OtaManifestDto>> {
    return this.deviceOtaService.getManifest(deviceId);
  }

  @Post(':deviceId/push')
  @UseGuards(DeviceSecretGuard)
  @HttpCode(HttpStatus.OK)
  async pushTelemetry(@CurrentDevice() device: DeviceEntity, @Body() payload: unknown): Promise<ResponseCore<null>> {
    await this.deviceService.recordTelemetry(device.deviceId, payload);

    return ResponseCore.ok(null);
  }
}
