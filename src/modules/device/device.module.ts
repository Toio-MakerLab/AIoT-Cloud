import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { DeviceTemplateEntity } from '../device-template/device-template.entity.ts';
import { DeviceController } from './device.controller.ts';
import { DeviceEntity } from './device.entity.ts';
import { DeviceService } from './device.service.ts';
import { DeviceProvisioningController } from './device-provisioning.controller.ts';
import { DeviceTelemetryEntity } from './device-telemetry.entity.ts';
import { DeviceSecretGuard } from './guards/device-secret.guard.ts';
import { KAFKA_COMMAND_CLIENT } from './kafka-command.client.ts';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceEntity, DeviceTemplateEntity, DeviceTelemetryEntity]),
    ClientsModule.registerAsync([
      {
        name: KAFKA_COMMAND_CLIENT,
        useFactory: (configService: ApiConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: `${configService.kafkaConfig.clientId}-commands`,
              brokers: configService.kafkaConfig.brokers.split(','),
            },
          },
        }),
        inject: [ApiConfigService],
      },
    ]),
  ],
  controllers: [DeviceController, DeviceProvisioningController],
  exports: [DeviceService],
  providers: [DeviceService, DeviceSecretGuard],
})
export class DeviceModule {}
