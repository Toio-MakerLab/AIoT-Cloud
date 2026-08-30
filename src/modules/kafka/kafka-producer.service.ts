import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { Producer, RecordMetadata, SASLOptions } from 'kafkajs';
import { Kafka } from 'kafkajs';

import { ApiConfigService } from '../../shared/services/api-config.service.ts';

/**
 * Thin wrapper around a single shared kafkajs `Producer`, replacing @nestjs/microservices'
 * ClientKafka. Connects once on app startup (onModuleInit — part of Nest's normal bootstrap,
 * never a standalone script) and stays connected for the process lifetime. Domain services
 * (DeviceService, etc.) inject this directly to publish outbound messages (e.g. devices.commands)
 * instead of going through Nest's Kafka transport.
 */
@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private producer?: Producer;

  constructor(private readonly apiConfigService: ApiConfigService) {}

  async onModuleInit(): Promise<void> {
    if (!this.apiConfigService.kafkaEnabled) {
      return;
    }

    const { brokers, clientId, ssl, sasl } = this.apiConfigService.kafkaConfig;

    const kafka = new Kafka({
      clientId,
      brokers: brokers.split(','),
      ssl,
      sasl: sasl as SASLOptions | undefined,
    });

    this.producer = kafka.producer();

    try {
      await this.producer.connect();
    } catch (error) {
      this.logger.error(`Failed to connect Kafka producer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer?.disconnect();
  }

  /** Publishes a JSON-serialized message, keyed (e.g. by deviceId) so per-key ordering/partitioning matches the old ClientKafka behavior. */
  async send(topic: string, value: Record<string, unknown>, key?: string): Promise<RecordMetadata[]> {
    if (!this.producer) {
      throw new Error('Kafka producer is not connected (KAFKA_ENABLED is false or the initial connect failed)');
    }

    return this.producer.send({
      topic,
      messages: [{ key, value: JSON.stringify(value) }],
    });
  }
}
