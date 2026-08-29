import { Module } from '@nestjs/common';

import { DeviceModule } from '../device/device.module.ts';
import { KafkaController } from './kafka.controller.ts';
import { KafkaTopicsInitializer } from './kafka-topics.initializer.ts';

@Module({
  imports: [DeviceModule],
  controllers: [KafkaController],
  providers: [KafkaTopicsInitializer],
})
export class KafkaModule {}
