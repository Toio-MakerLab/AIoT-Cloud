import { Module } from '@nestjs/common';

import { MqttController } from './mqtt.controller.ts';

@Module({
  controllers: [MqttController],
})
export class MqttModule {}
