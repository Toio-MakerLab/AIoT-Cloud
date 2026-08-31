import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { Consumer, EachMessagePayload, SASLOptions } from 'kafkajs';
import { Kafka } from 'kafkajs';

import { KAFKA_ALERT_TOPIC, KAFKA_DEVICE_EVENTS_TOPIC, KAFKA_STATUS_TOPIC, KAFKA_TELEMETRY_TOPIC } from '../../constants/kafka-topics.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
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

interface KafkaAlertPayload {
  deviceId?: string;
  message?: string;
  channels?: string[];
  [key: string]: unknown;
}

/**
 * Raw kafkajs consumer for the four inbound gateway->cloud topics, replacing
 * @nestjs/microservices' ServerKafka + @EventPattern controller. Connects/subscribes once on app
 * startup (onModuleInit — part of Nest's normal bootstrap, never a standalone script) and runs
 * for the process lifetime.
 *
 * Every handler below must never let an error escape `eachMessage`: kafkajs awaits that promise
 * inside its own consume loop, and an unhandled rejection there crashes the whole consumer (all
 * topics, not just one) with no auto-restart — one bad message (malformed payload, a transient DB
 * error, whatever) would silently kill the consumer for good instead of just failing that message.
 */
@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  // Capped exponential-ish backoff; holds at the last value instead of growing unbounded so a
  // still-broken broker gets retried every minute forever rather than giving up.
  private static readonly RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000];

  private consumer?: Consumer;
  private retryTimer?: NodeJS.Timeout;
  private destroyed = false;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly deviceService: DeviceService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.apiConfigService.kafkaEnabled) {
      return;
    }

    await this.connectAndSubscribe(0);
  }

  async onModuleDestroy(): Promise<void> {
    this.destroyed = true;
    clearTimeout(this.retryTimer);
    await this.consumer?.disconnect();
  }

  /**
   * A broker being unreachable/not-yet-ready (e.g. `__consumer_offsets` hasn't been created yet on
   * a brand-new single-broker cluster, or a managed cluster rejecting subscriptions before its
   * topics are fully provisioned — see KafkaTopicsInitializer) shouldn't take the whole HTTP API
   * down with it, nor should it need a manual app restart once the broker sorts itself out: log
   * and retry with backoff instead of giving up for the process lifetime. Runs entirely within
   * this service's own startup lifecycle (onModuleInit -> self-scheduled retries), never a
   * standalone script reaching for the broker outside of that.
   */
  private async connectAndSubscribe(attempt: number): Promise<void> {
    const { brokers, clientId, groupId, ssl, sasl } = this.apiConfigService.kafkaConfig;

    const kafka = new Kafka({
      clientId,
      brokers: brokers.split(','),
      ssl,
      sasl: sasl as SASLOptions | undefined,
    });

    this.consumer = kafka.consumer({ groupId, allowAutoTopicCreation: false });

    // kafkajs only auto-restarts a crashed consumer when the triggering error is "retriable"
    // (see kafkajs' protocol/error.js). A group-protocol mismatch — e.g. a stale/zombie member
    // from a previous instance of this same service still registered on the broker when a new
    // one joins (KafkaJSProtocolError: "supported protocols are incompatible with those of
    // existing members") — is explicitly marked non-retriable, so kafkajs gives up silently and
    // leaves the consumer dead until the whole process restarts. Wire the crash event into the
    // same backoff loop used for startup failures so a transient broker-side issue like that
    // self-heals (the stale member's session expires on the broker in the meantime) instead of
    // needing a manual restart.
    this.consumer.on(this.consumer.events.CRASH, ({ payload }) => {
      this.logger.error(`Kafka consumer crashed: ${payload.error instanceof Error ? payload.error.message : String(payload.error)}`);

      if (this.destroyed || payload.restart) {
        // Either shutting down, or kafkajs already decided to restart this one itself.
        return;
      }

      clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => void this.connectAndSubscribe(0), KafkaConsumerService.RETRY_DELAYS_MS[0]);
    });

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topics: [KAFKA_TELEMETRY_TOPIC, KAFKA_STATUS_TOPIC, KAFKA_DEVICE_EVENTS_TOPIC, KAFKA_ALERT_TOPIC],
        fromBeginning: false,
      });
      await this.consumer.run({ eachMessage: (payload) => this.handleMessage(payload) });

      if (attempt > 0) {
        this.logger.log(`Kafka consumer connected after ${attempt} retr${attempt === 1 ? 'y' : 'ies'}`);
      }
    } catch (error) {
      this.logger.error(`Failed to start Kafka consumer (attempt ${attempt + 1}): ${error instanceof Error ? error.message : String(error)}`);
      await this.consumer.disconnect().catch(() => undefined);

      if (this.destroyed) {
        return;
      }

      const delay = KafkaConsumerService.RETRY_DELAYS_MS[Math.min(attempt, KafkaConsumerService.RETRY_DELAYS_MS.length - 1)];
      this.retryTimer = setTimeout(() => void this.connectAndSubscribe(attempt + 1), delay);
    }
  }

  private async handleMessage({ topic, partition, message }: EachMessagePayload): Promise<void> {
    const raw = message.value?.toString('utf8');
    let data: Record<string, unknown>;

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (error) {
      this.logger.error(`Failed to parse Kafka message on [${topic}]: ${error instanceof Error ? error.message : String(error)}`);

      return;
    }

    this.logger.debug(`[${topic}] ${raw}`);
    this.logger.log({ topic, partition, offset: message.offset, data });

    try {
      switch (topic) {
        case KAFKA_TELEMETRY_TOPIC: {
          await this.handleTelemetry(data);
          break;
        }
        case KAFKA_STATUS_TOPIC: {
          await this.handleStatus(data);
          break;
        }
        case KAFKA_DEVICE_EVENTS_TOPIC: {
          await this.handleDeviceEvent(data);
          break;
        }
        case KAFKA_ALERT_TOPIC: {
          await this.handleAlert(data);
          break;
        }
        default: {
          this.logger.warn(`Received Kafka message on unhandled topic: ${topic}`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle [${topic}] message: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async handleTelemetry(data: KafkaTelemetryPayload): Promise<void> {
    const { deviceId, ...telemetry } = data ?? {};

    if (!deviceId) {
      this.logger.warn(`Received Kafka telemetry message without deviceId: ${JSON.stringify(data)}`);

      return;
    }

    await this.deviceService.recordTelemetry(deviceId, telemetry);
  }

  private async handleStatus(data: KafkaStatusPayload): Promise<void> {
    const { deviceId, ...status } = data ?? {};

    if (!deviceId) {
      this.logger.warn(`Received Kafka status message without deviceId: ${JSON.stringify(data)}`);

      return;
    }

    await this.deviceService.handleDeviceStatusMessage(deviceId, status);
  }

  private async handleDeviceEvent(data: KafkaDeviceEventPayload): Promise<void> {
    const { device_id: deviceId, topic, message } = data ?? {};

    if (!deviceId) {
      this.logger.warn(`Received Kafka device event without device_id: ${JSON.stringify(data)}`);

      return;
    }

    await this.deviceService.handleDeviceChannelEvent(deviceId, topic ?? KAFKA_DEVICE_EVENTS_TOPIC, message);
  }

  private async handleAlert(data: KafkaAlertPayload): Promise<void> {
    const { deviceId, ...alert } = data ?? {};

    if (!deviceId) {
      this.logger.warn(`Received Kafka alert message without deviceId: ${JSON.stringify(data)}`);

      return;
    }

    await this.deviceService.handleDeviceAlert(deviceId, alert);
  }
}
