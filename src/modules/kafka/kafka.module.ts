import { Module } from '@nestjs/common';

import { DeviceModule } from '../device/device.module.ts';
import { KafkaController } from './kafka.controller.ts';

@Module({
  imports: [DeviceModule],
  controllers: [KafkaController],
})
export class KafkaModule {}
