import { forwardRef, Module } from '@nestjs/common';

import { DeviceModule } from '../device/device.module.ts';
import { KafkaConsumerService } from './kafka-consumer.service.ts';
import { KafkaProducerService } from './kafka-producer.service.ts';
import { KafkaTopicsInitializer } from './kafka-topics.initializer.ts';

// Owns Kafka end-to-end via raw kafkajs — no @nestjs/microservices transport involved: topic
// provisioning on boot, a shared producer for outbound commands, and a consumer for the three
// inbound gateway->cloud topics. Needs DeviceModule for DeviceService (the consumer calls
// straight into it), and DeviceModule needs this module for KafkaProducerService — forwardRef()
// on both sides breaks the resulting circular import.
@Module({
  imports: [forwardRef(() => DeviceModule)],
  providers: [KafkaTopicsInitializer, KafkaProducerService, KafkaConsumerService],
  exports: [KafkaProducerService],
})
export class KafkaModule {}
