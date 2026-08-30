import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { SASLOptions } from 'kafkajs';

import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { DeviceTemplateEntity } from '../device-template/device-template.entity.ts';
import { DeviceController } from './device.controller.ts';
import { DeviceEntity } from './device.entity.ts';
import { DeviceService } from './device.service.ts';
import { DeviceProvisioningController } from './device-provisioning.controller.ts';
import { DeviceSecretController } from './device-secret.controller.ts';
import { DeviceSecretEntity } from './device-secret.entity.ts';
import { DeviceSecretService } from './device-secret.service.ts';
import { DeviceStatusScheduler } from './device-status.scheduler.ts';
import { DeviceTelemetryEntity } from './device-telemetry.entity.ts';
import { DeviceSecretGuard } from './guards/device-secret.guard.ts';
import { KAFKA_COMMAND_CLIENT } from './kafka-command.client.ts';
import { UnclaimedDeviceEntity } from './unclaimed-device.entity.ts';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceEntity, DeviceTemplateEntity, DeviceTelemetryEntity, DeviceSecretEntity, UnclaimedDeviceEntity]),
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
  controllers: [DeviceController, DeviceProvisioningController, DeviceSecretController],
  exports: [DeviceService],
  providers: [DeviceService, DeviceSecretService, DeviceSecretGuard, DeviceStatusScheduler],
})
export class DeviceModule {}
