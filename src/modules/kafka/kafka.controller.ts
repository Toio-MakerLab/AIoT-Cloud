import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { KAFKA_STATUS_TOPIC, KAFKA_TELEMETRY_TOPIC } from '../../constants/kafka-topics.ts';
import { DeviceService } from '../device/device.service.ts';

interface KafkaTelemetryPayload {
  deviceId?: string;
  [key: string]: unknown;
}

interface KafkaStatusPayload {
  deviceId?: string;
  status?: string;
  [key: string]: unknown;
}

@Controller()
export class KafkaController {
  private readonly logger = new Logger(KafkaController.name);

  constructor(private readonly deviceService: DeviceService) {}

  @EventPattern(KAFKA_TELEMETRY_TOPIC)
  async handleTelemetry(@Payload() data: KafkaTelemetryPayload): Promise<void> {
    const { deviceId, ...telemetry } = data ?? {};

    if (!deviceId) {
      this.logger.warn(`Received Kafka telemetry message without deviceId: ${JSON.stringify(data)}`);

      return;
    }

    await this.deviceService.recordTelemetry(deviceId, telemetry);
  }

  @EventPattern(KAFKA_STATUS_TOPIC)
  async handleStatus(@Payload() data: KafkaStatusPayload): Promise<void> {
    const { deviceId, ...status } = data ?? {};

    if (!deviceId) {
      this.logger.warn(`Received Kafka status message without deviceId: ${JSON.stringify(data)}`);

      return;
    }

    await this.deviceService.handleDeviceStatusMessage(deviceId, status);
  }
}
