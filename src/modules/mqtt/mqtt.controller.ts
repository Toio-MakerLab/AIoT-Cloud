import { Controller, Logger } from '@nestjs/common';
import type { MqttContext } from '@nestjs/microservices';
import { Ctx, EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { CHANNEL_COMMAND_TOPIC_REGEX, COMMAND_TOPIC_REGEX, STATUS_TOPIC_REGEX, TELEMETRY_TOPIC_REGEX } from '../../constants/mqtt-topics.ts';
import { DeviceService } from '../device/device.service.ts';

@Controller()
export class MqttController {
  private readonly logger = new Logger(MqttController.name);

  constructor(private readonly deviceService: DeviceService) {}

  @MessagePattern('devices/ping')
  ping(@Payload() data: unknown): { pong: true; receivedAt: string; data: unknown } {
    return { pong: true, receivedAt: new Date().toISOString(), data };
  }

  // '#' is the MQTT multi-level wildcard: matches every topic the client is subscribed to.
  // Route by topic shape here instead of registering a separate @EventPattern per topic.
  @EventPattern('#')
  handleAny(@Payload() data: unknown, @Ctx() context: MqttContext): void {
    const topic = context.getTopic();
    this.logger.log(`[${topic}] ${JSON.stringify(data)}`);

    const telemetryDeviceId = TELEMETRY_TOPIC_REGEX.exec(topic)?.[1];

    if (telemetryDeviceId) {
      void this.handleDeviceTelemetry(telemetryDeviceId, data);

      return;
    }

    const statusDeviceId = STATUS_TOPIC_REGEX.exec(topic)?.[1];

    if (statusDeviceId) {
      void this.handleDeviceStatus(statusDeviceId, data);

      return;
    }

    // Command topics are backend -> device (downlink); the broker echoes our own
    // publishes back through this wildcard subscription, so ignore rather than re-process.
    if (COMMAND_TOPIC_REGEX.test(topic) || CHANNEL_COMMAND_TOPIC_REGEX.test(topic)) {
      return;
    }
  }

  private async handleDeviceTelemetry(deviceId: string, data: unknown): Promise<void> {
    this.logger.log(`Telemetry from device ${deviceId}: ${JSON.stringify(data)}`);
    await this.deviceService.recordTelemetry(deviceId, data);
  }

  private async handleDeviceStatus(deviceId: string, data: unknown): Promise<void> {
    this.logger.log(`Status from device ${deviceId}: ${JSON.stringify(data)}`);
    await this.deviceService.handleDeviceStatusMessage(deviceId, data);
  }
}
