import { Module } from '@nestjs/common';

import { DeviceModule } from '../device/device.module.ts';
import { MqttController } from './mqtt.controller.ts';

@Module({
  imports: [DeviceModule],
  controllers: [MqttController],
})
export class MqttModule {}
