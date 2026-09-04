import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { MqttClient } from 'mqtt';
import mqtt from 'mqtt';

import { ApiConfigService } from '../../shared/services/api-config.service.ts';

/**
 * Thin wrapper around a single shared `mqtt` client used for outbound (cloud -> device)
 * publishes, replacing @nestjs/microservices' MQTT `ClientProxy` — that transport only ever
 * exposes send/emit against a request-response or event pattern, not a raw `publish` onto an
 * arbitrary topic, and the app's inbound MQTT wiring (`connectMicroservice({ transport:
 * Transport.MQTT })` in main.ts) is subscribe-only. Connects once on app startup (onModuleInit)
 * and stays connected for the process lifetime, same lifecycle as `KafkaProducerService`.
 *
 * `DeviceService` injects this to publish downlink commands directly to devices on the `MQTT`
 * push channel (their own topic, resolved from `device.config.mqtt.topics`) — distinct from the
 * `KAFKA_GATEWAY_COMMANDS_TOPIC` relay path, which is for devices bridged by a gateway rather
 * than connected to this broker directly.
 */
@Injectable()
export class MqttProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttProducerService.name);
  private client?: MqttClient;

  constructor(private readonly apiConfigService: ApiConfigService) {}

  onModuleInit(): void {
    if (!this.apiConfigService.mqttEnabled) {
      return;
    }

    const { url, username, password } = this.apiConfigService.mqttConfig;

    this.client = mqtt.connect(url, { username, password, clientId: `aiot-lab-service-producer-${Math.random().toString(16).slice(2)}` });

    this.client.on('error', (error) => {
      this.logger.error(`MQTT producer client error: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await new Promise<void>((resolve) => (this.client ? this.client.end(false, {}, () => resolve()) : resolve()));
  }

  /** Publishes a JSON-serialized message to an arbitrary topic (e.g. a device's own command topic). */
  async publish(topic: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.client) {
      throw new Error('MQTT producer is not connected (MQTT_ENABLED is false or the app never started it)');
    }

    await new Promise<void>((resolve, reject) => {
      this.client?.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => (error ? reject(error) : resolve()));
    });
  }
}
