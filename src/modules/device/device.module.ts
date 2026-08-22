import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeviceTemplateEntity } from '../device-template/device-template.entity.ts';
import { DeviceController } from './device.controller.ts';
import { DeviceEntity } from './device.entity.ts';
import { DeviceService } from './device.service.ts';
import { DeviceTelemetryEntity } from './device-telemetry.entity.ts';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceEntity, DeviceTemplateEntity, DeviceTelemetryEntity])],
  controllers: [DeviceController],
  exports: [DeviceService],
  providers: [DeviceService],
})
export class DeviceModule {}
