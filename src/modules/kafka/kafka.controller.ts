import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';

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

  // Every handler below must never let an error escape: KafkaJS awaits this promise inside its
  // own eachMessage loop, and an unhandled rejection there crashes the whole consumer (all
  // topics, not just this one) with no auto-restart from NestJS's Kafka server — one bad
  // message (malformed payload, a transient DB error, whatever) would silently kill the
  // consumer for good instead of just failing that one message.
  @EventPattern(KAFKA_TELEMETRY_TOPIC)
  async handleTelemetry(@Payload() data: KafkaTelemetryPayload, @Ctx() context: KafkaContext): Promise<void> {
    this.logger.debug(`[${KAFKA_TELEMETRY_TOPIC}] ${JSON.stringify(data)}`);
    this.logger.log({
      topic: context.getTopic(),
      partition: context.getPartition(),
      offset: context.getMessage().offset,
      data: data,
    });

    try {
      const { deviceId, ...telemetry } = data ?? {};

      if (!deviceId) {
        this.logger.warn(`Received Kafka telemetry message without deviceId: ${JSON.stringify(data)}`);

        return;
      }

      await this.deviceService.recordTelemetry(deviceId, telemetry);
    } catch (error) {
      this.logger.error(`Failed to handle [${KAFKA_TELEMETRY_TOPIC}] message: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
    }
  }

  @EventPattern(KAFKA_STATUS_TOPIC)
  async handleStatus(@Payload() data: KafkaStatusPayload, @Ctx() context: KafkaContext): Promise<void> {
    this.logger.debug(`[${KAFKA_STATUS_TOPIC}] ${JSON.stringify(data)}`);
    this.logger.log({
      topic: context.getTopic(),
      partition: context.getPartition(),
      offset: context.getMessage().offset,
      data: data,
    });

    try {
      const { deviceId, ...status } = data ?? {};

      if (!deviceId) {
        this.logger.warn(`Received Kafka status message without deviceId: ${JSON.stringify(data)}`);

        return;
      }

      await this.deviceService.handleDeviceStatusMessage(deviceId, status);
    } catch (error) {
      this.logger.error(`Failed to handle [${KAFKA_STATUS_TOPIC}] message: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
    }
  }

  @EventPattern(KAFKA_DEVICE_EVENTS_TOPIC)
  async handleDeviceEvent(@Payload() data: KafkaDeviceEventPayload, @Ctx() context: KafkaContext): Promise<void> {
    this.logger.debug(`[${KAFKA_DEVICE_EVENTS_TOPIC}] ${JSON.stringify(data)}`);
    this.logger.log({
      topic: context.getTopic(),
      partition: context.getPartition(),
      offset: context.getMessage().offset,
      data: data,
    });

    try {
      const { device_id: deviceId, topic, message } = data ?? {};

      if (!deviceId) {
        this.logger.warn(`Received Kafka device event without device_id: ${JSON.stringify(data)}`);

        return;
      }

      await this.deviceService.handleDeviceChannelEvent(deviceId, topic ?? KAFKA_DEVICE_EVENTS_TOPIC, message);
    } catch (error) {
      this.logger.error(`Failed to handle [${KAFKA_DEVICE_EVENTS_TOPIC}] message: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
    }
  }
}
