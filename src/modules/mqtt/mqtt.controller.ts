import { Controller, Logger } from '@nestjs/common';
import type { MqttContext } from '@nestjs/microservices';
import { Ctx, EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import {
  CHANNEL_COMMAND_TOPIC_REGEX,
  COMMAND_TOPIC_REGEX,
  EVENT_TOPIC_REGEX,
  OTA_STATUS_TOPIC_REGEX,
  OTA_TOPIC_REGEX,
  STATUS_TOPIC_REGEX,
  TELEMETRY_TOPIC_REGEX,
} from '../../constants/mqtt-topics.ts';
import type { DeviceChannelEventPayload } from '../device/device.service.ts';
import { DeviceService } from '../device/device.service.ts';
import { DeviceOtaService } from '../device/device-ota.service.ts';
import type { ResolvedMqttTopic } from './mqtt-topic-registry.service.ts';
import { MqttTopicRegistryService } from './mqtt-topic-registry.service.ts';

@Controller()
export class MqttController {
  private readonly logger = new Logger(MqttController.name);

  constructor(
    private readonly deviceService: DeviceService,
    private readonly deviceOtaService: DeviceOtaService,
    private readonly mqttTopicRegistryService: MqttTopicRegistryService,
  ) {}

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

    // A device confirming (or reporting the failure of) a downlink command it received on its
    // own command topic — see `defaultEventTopic`'s doc comment. Same envelope shape as Kafka's
    // `devices.events` (`{ key, value, status?, error? }`), routed through the same handler.
    const eventDeviceId = EVENT_TOPIC_REGEX.exec(topic)?.[1];

    if (eventDeviceId) {
      void this.handleDeviceChannelEvent(eventDeviceId, data);

      return;
    }

    // A device reporting OTA download/install progress or the final result — see
    // `defaultOtaStatusTopic`'s doc comment.
    const otaStatusDeviceId = OTA_STATUS_TOPIC_REGEX.exec(topic)?.[1];

    if (otaStatusDeviceId) {
      void this.deviceOtaService.handleOtaStatusReport(otaStatusDeviceId, data as Record<string, unknown>);

      return;
    }

    // Command/OTA topics are backend -> device (downlink); the broker echoes our own
    // publishes back through this wildcard subscription, so ignore rather than re-process.
    if (COMMAND_TOPIC_REGEX.test(topic) || CHANNEL_COMMAND_TOPIC_REGEX.test(topic) || OTA_TOPIC_REGEX.test(topic)) {
      return;
    }

    // Doesn't match any of the default `devices/{deviceId}/...` shapes above — could be a device
    // with a custom topic override in `config.mqtt.topics`, or broker traffic unrelated to any
    // device entirely (this subscription is broker-wide). Reverse-lookup which device/role it
    // belongs to, if any — see `resolveCustomTopic`/`MqttTopicRegistryService`.
    void this.resolveCustomTopic(topic, data);
  }

  private async handleDeviceTelemetry(deviceId: string, data: unknown): Promise<void> {
    this.logger.log(`Telemetry from device ${deviceId}: ${JSON.stringify(data)}`);
    await this.deviceService.recordTelemetry(deviceId, data);
  }

  private async handleDeviceStatus(deviceId: string, data: unknown): Promise<void> {
    this.logger.log(`Status from device ${deviceId}: ${JSON.stringify(data)}`);
    await this.deviceService.handleDeviceStatusMessage(deviceId, data);
  }

  private async handleDeviceChannelEvent(deviceId: string, data: unknown): Promise<void> {
    this.logger.log(`Event from device ${deviceId}: ${JSON.stringify(data)}`);
    await this.deviceService.handleDeviceChannelEvent(deviceId, (data ?? {}) as DeviceChannelEventPayload);
  }

  /**
   * Cache-first reverse lookup for a topic that didn't match the default shape — a cached hit or
   * a recent negative result (see `MqttTopicRegistryService`) skips the DB entirely; otherwise
   * asks `DeviceService.resolveCustomMqttTopic` and caches whatever it finds (including "none",
   * so a topic unrelated to any device doesn't get re-queried on every message).
   */
  private async resolveCustomTopic(topic: string, data: unknown): Promise<void> {
    const cached = this.mqttTopicRegistryService.get(topic);

    if (cached) {
      this.dispatchByRole(cached, data);

      return;
    }

    if (this.mqttTopicRegistryService.isRecentMiss(topic)) {
      return;
    }

    const resolved = await this.deviceService.resolveCustomMqttTopic(topic);

    if (!resolved) {
      this.mqttTopicRegistryService.recordMiss(topic);
      this.logger.debug(`Ignoring unrecognized topic ${topic}`);

      return;
    }

    this.mqttTopicRegistryService.recordHit(topic, resolved);
    this.dispatchByRole(resolved, data);
  }

  private dispatchByRole(resolved: ResolvedMqttTopic, data: unknown): void {
    switch (resolved.role) {
      case 'telemetry':
        void this.handleDeviceTelemetry(resolved.deviceId, data);
        break;
      case 'status':
        void this.handleDeviceStatus(resolved.deviceId, data);
        break;
      case 'event':
        void this.handleDeviceChannelEvent(resolved.deviceId, data);
        break;
      case 'command':
        // Downlink topic (or its own echo) resolved via custom override — nothing to do, same as
        // the COMMAND_TOPIC_REGEX/CHANNEL_COMMAND_TOPIC_REGEX case above for the default shape.
        break;
    }
  }
}
