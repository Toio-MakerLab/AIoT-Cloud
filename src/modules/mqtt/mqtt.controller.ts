import { Controller, Logger } from '@nestjs/common';
import type { MqttContext } from '@nestjs/microservices';
import { Ctx, EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class MqttController {
  private readonly logger = new Logger(MqttController.name);

  @MessagePattern('devices/ping')
  ping(@Payload() data: unknown): { pong: true; receivedAt: string; data: unknown } {
    return { pong: true, receivedAt: new Date().toISOString(), data };
  }

  // '#' is the MQTT multi-level wildcard: matches every topic the client is subscribed to.
  // Route by topic shape here instead of registering a separate @EventPattern per topic.
  @EventPattern('#')
  handleAny(@Payload() data: unknown, @Ctx() context: MqttContext): void {
    const topic = context.getTopic();
    const telemetryMatch = /^devices\/([^/]+)\/telemetry$/.exec(topic);

    const deviceId = telemetryMatch?.[1];

    if (deviceId) {
      this.handleDeviceTelemetry(deviceId, data);

      return;
    }

    this.logger.log(`[${topic}] ${JSON.stringify(data)}`);
  }

  private handleDeviceTelemetry(deviceId: string, data: unknown): void {
    this.logger.log(`Telemetry from device ${deviceId}: ${JSON.stringify(data)}`);
  }
}
