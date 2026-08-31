import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeviceEntity } from '../device/device.entity.ts';
import { UserEntity } from '../user/user.entity.ts';
import { FactoryController } from './factory.controller.ts';
import { FactoryEntity } from './factory.entity.ts';
import { FactoryService } from './factory.service.ts';

@Module({
  imports: [TypeOrmModule.forFeature([FactoryEntity, UserEntity, DeviceEntity])],
  controllers: [FactoryController],
  exports: [FactoryService],
  providers: [FactoryService],
})
export class FactoryModule {}
