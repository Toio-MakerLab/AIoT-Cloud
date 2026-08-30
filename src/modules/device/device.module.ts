import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeviceTemplateEntity } from '../device-template/device-template.entity.ts';
import { KafkaModule } from '../kafka/kafka.module.ts';
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
import { UnclaimedDeviceEntity } from './unclaimed-device.entity.ts';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceEntity, DeviceTemplateEntity, DeviceTelemetryEntity, DeviceSecretEntity, UnclaimedDeviceEntity]),
    // KafkaProducerService (a raw kafkajs producer) lives in KafkaModule, imported here so
    // DeviceService can inject it. KafkaModule also owns the inbound Kafka consumer and needs
    // DeviceService back, so forwardRef() on both sides breaks the resulting circular import.
    forwardRef(() => KafkaModule),
  ],
  controllers: [DeviceController, DeviceProvisioningController, DeviceSecretController],
  exports: [DeviceService],
  providers: [DeviceService, DeviceSecretService, DeviceSecretGuard, DeviceStatusScheduler],
})
export class DeviceModule {}
