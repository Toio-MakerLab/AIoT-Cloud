import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { KAFKA_DEVICE_EVENTS_TOPIC, KAFKA_STATUS_TOPIC, KAFKA_TELEMETRY_TOPIC } from '../../constants/kafka-topics.ts';
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

interface KafkaDeviceEventPayload {
  device_id?: string;
  topic?: string;
  message?: unknown;
  [key: string]: unknown;
}

@Controller()
export class KafkaController {
  private readonly logger = new Logger(KafkaController.name);

  constructor(private readonly deviceService: DeviceService) {}

  @EventPattern(KAFKA_TELEMETRY_TOPIC)
  async handleTelemetry(@Payload() data: KafkaTelemetryPayload): Promise<void> {
    this.logger.debug(`[${KAFKA_TELEMETRY_TOPIC}] ${JSON.stringify(data)}`);

    const { deviceId, ...telemetry } = data ?? {};

    if (!deviceId) {
      this.logger.warn(`Received Kafka telemetry message without deviceId: ${JSON.stringify(data)}`);

      return;
    }

    await this.deviceService.recordTelemetry(deviceId, telemetry);
  }

  @EventPattern(KAFKA_STATUS_TOPIC)
  async handleStatus(@Payload() data: KafkaStatusPayload): Promise<void> {
    this.logger.debug(`[${KAFKA_STATUS_TOPIC}] ${JSON.stringify(data)}`);

    const { deviceId, ...status } = data ?? {};

    if (!deviceId) {
      this.logger.warn(`Received Kafka status message without deviceId: ${JSON.stringify(data)}`);

      return;
    }

    await this.deviceService.handleDeviceStatusMessage(deviceId, status);
  }

  @EventPattern(KAFKA_DEVICE_EVENTS_TOPIC)
  async handleDeviceEvent(@Payload() data: KafkaDeviceEventPayload): Promise<void> {
    this.logger.debug(`[${KAFKA_DEVICE_EVENTS_TOPIC}] ${JSON.stringify(data)}`);

    const { device_id: deviceId, topic, message } = data ?? {};

    if (!deviceId) {
      this.logger.warn(`Received Kafka device event without device_id: ${JSON.stringify(data)}`);

      return;
    }

    await this.deviceService.handleDeviceChannelEvent(deviceId, topic ?? KAFKA_DEVICE_EVENTS_TOPIC, message);
  }
}
