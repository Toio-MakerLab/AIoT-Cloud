import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeviceEntity } from '../device/device.entity.ts';
import { DeviceTemplateController } from './device-template.controller.ts';
import { DeviceTemplateEntity } from './device-template.entity.ts';
import { DeviceTemplateService } from './device-template.service.ts';
import { FirmwareController } from './firmware.controller.ts';
import { FirmwareEntity } from './firmware.entity.ts';
import { FirmwareService } from './firmware.service.ts';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceTemplateEntity, DeviceEntity, FirmwareEntity])],
  controllers: [DeviceTemplateController, FirmwareController],
  exports: [DeviceTemplateService, FirmwareService],
  providers: [DeviceTemplateService, FirmwareService],
})
export class DeviceTemplateModule {}
