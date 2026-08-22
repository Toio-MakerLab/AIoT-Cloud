import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeviceEntity } from '../device/device.entity.ts';
import { DeviceTemplateController } from './device-template.controller.ts';
import { DeviceTemplateEntity } from './device-template.entity.ts';
import { DeviceTemplateService } from './device-template.service.ts';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceTemplateEntity, DeviceEntity])],
  controllers: [DeviceTemplateController],
  exports: [DeviceTemplateService],
  providers: [DeviceTemplateService],
})
export class DeviceTemplateModule {}
