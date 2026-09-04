import { forwardRef, Module } from '@nestjs/common';

import { DeviceModule } from '../device/device.module.ts';
import { MqttController } from './mqtt.controller.ts';
import { MqttProducerService } from './mqtt-producer.service.ts';
import { MqttTopicRegistryService } from './mqtt-topic-registry.service.ts';

// MqttProducerService (a raw `mqtt` client) and MqttTopicRegistryService (custom-topic cache)
// live here so DeviceService can inject them — the former for downlink command publishes, the
// latter to invalidate on `updateDeviceConfig`. DeviceModule needs this module for those
// services, and this module needs DeviceModule for MqttController's inbound handlers —
// forwardRef() on both sides breaks the resulting circular import, same pattern as
// KafkaModule/DeviceModule.
@Module({
  imports: [forwardRef(() => DeviceModule)],
  controllers: [MqttController],
  providers: [MqttProducerService, MqttTopicRegistryService],
  exports: [MqttProducerService, MqttTopicRegistryService],
})
export class MqttModule {}
