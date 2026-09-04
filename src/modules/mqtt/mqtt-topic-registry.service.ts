import { Injectable } from '@nestjs/common';

export type MqttTopicRole = 'telemetry' | 'status' | 'event' | 'command';

export interface ResolvedMqttTopic {
  deviceId: string;
  role: MqttTopicRole;
}

/** How long an unresolved topic is remembered as "not a device topic" before it's re-checked against the DB. */
const NEGATIVE_TTL_MS = 60_000;

/**
 * In-memory cache mapping an MQTT topic string to the device/role it belongs to, for topics that
 * don't match the default `devices/{deviceId}/...` shape (a device configured with a custom
 * topic override in `config.mqtt.topics` — see `DeviceService.resolveCustomMqttTopic`).
 *
 * Exists because `MqttController` subscribes broker-wide (`#`, see main.ts's `Transport.MQTT`
 * setup) — every message whose topic doesn't match the default shape would otherwise cost a
 * JSONB query per message, including for ordinary broker traffic unrelated to any device (other
 * apps sharing the broker, retained messages, etc.). Positive hits are cached indefinitely since
 * topic overrides rarely change (cleared by `DeviceService.updateDeviceConfig` whenever they do);
 * misses are cached briefly so a noisy unrelated topic doesn't hammer the DB on every message.
 */
@Injectable()
export class MqttTopicRegistryService {
  private readonly resolved = new Map<string, ResolvedMqttTopic>();
  private readonly missedAt = new Map<string, number>();

  get(topic: string): ResolvedMqttTopic | undefined {
    return this.resolved.get(topic);
  }

  isRecentMiss(topic: string): boolean {
    const missedAt = this.missedAt.get(topic);

    return missedAt !== undefined && Date.now() - missedAt < NEGATIVE_TTL_MS;
  }

  recordHit(topic: string, resolved: ResolvedMqttTopic): void {
    this.resolved.set(topic, resolved);
    this.missedAt.delete(topic);
  }

  recordMiss(topic: string): void {
    this.missedAt.set(topic, Date.now());
  }

  /** Called whenever any device's `config.mqtt.topics` may have changed, so stale entries don't linger. */
  clear(): void {
    this.resolved.clear();
    this.missedAt.clear();
  }
}
