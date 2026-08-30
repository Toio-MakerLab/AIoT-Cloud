import { forwardRef, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import type { SASLOptions } from 'kafkajs';

import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { DeviceModule } from '../device/device.module.ts';
import { KafkaController } from './kafka.controller.ts';
import { KAFKA_COMMAND_CLIENT } from './kafka-command.client.ts';
import { KafkaTopicsInitializer } from './kafka-topics.initializer.ts';

// Owns topic provisioning, the shared producer client, and the inbound @EventPattern handlers for
// device telemetry/status/events. Needs DeviceModule for DeviceService (handlers call straight into
// it), and DeviceModule needs this module for KAFKA_COMMAND_CLIENT — forwardRef() on both sides
// breaks that circular import.
@Module({
  imports: [
    forwardRef(() => DeviceModule),
    ClientsModule.registerAsync([
      {
        name: KAFKA_COMMAND_CLIENT,
        useFactory: (configService: ApiConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: `${configService.kafkaConfig.clientId}`,
              brokers: configService.kafkaConfig.brokers.split(','),
              ssl: configService.kafkaConfig.ssl,
              sasl: configService.kafkaConfig.sasl as SASLOptions | undefined,
            },
            consumer: {
              groupId: configService.kafkaConfig.groupId,
              allowAutoTopicCreation: false,
            },
            // We only ever `.emit()` to devices.commands (fire-and-forget, gateway consumes it) —
            // never `.send()`/await a reply — so there's no response topic to listen for. Without
            // this, ClientKafka defaults to also connecting a consumer and joining a group with zero
            // subscribed topics: a second, pointless listener alongside the real one in main.ts.
            producerOnlyMode: true,
          },
        }),
        inject: [ApiConfigService],
      },
    ]),
  ],
  controllers: [KafkaController],
  providers: [KafkaTopicsInitializer],
  exports: [ClientsModule],
})
export class KafkaModule {}
