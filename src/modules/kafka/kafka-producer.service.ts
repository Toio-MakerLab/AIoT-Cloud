import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { Producer, RecordMetadata, SASLOptions } from 'kafkajs';
import { Kafka, KafkaJSProtocolError } from 'kafkajs';

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
  private kafka?: Kafka;
  private producer?: Producer;

  constructor(private readonly apiConfigService: ApiConfigService) {}

  async onModuleInit(): Promise<void> {
    if (!this.apiConfigService.kafkaEnabled) {
      return;
    }

    const { brokers, clientId, ssl, sasl } = this.apiConfigService.kafkaConfig;

    this.kafka = new Kafka({
      clientId,
      brokers: brokers.split(','),
      ssl,
      sasl: sasl as SASLOptions | undefined,
    });

    this.producer = this.kafka.producer();

    try {
      await this.producer.connect();
    } catch (error) {
      this.logger.error(`Failed to connect Kafka producer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer?.disconnect();
  }

  /**
   * Publishes a JSON-serialized message, keyed (e.g. by deviceId) so per-key ordering/partitioning
   * matches the old ClientKafka behavior. If the broker reports the topic doesn't exist yet
   * (UNKNOWN_TOPIC_OR_PARTITION — e.g. a topic outside KafkaTopicsInitializer's managed list, or one
   * that was deleted/never provisioned), create it on the fly and retry once instead of blackholing
   * the message.
   */
  async send(topic: string, value: Record<string, unknown>, key?: string): Promise<RecordMetadata[]> {
    if (!this.producer) {
      throw new Error('Kafka producer is not connected (KAFKA_ENABLED is false or the initial connect failed)');
    }

    const record = { topic, messages: [{ key, value: JSON.stringify(value) }] };

    try {
      return await this.producer.send(record);
    } catch (error) {
      if (!(error instanceof KafkaJSProtocolError) || error.type !== 'UNKNOWN_TOPIC_OR_PARTITION') {
        throw error;
      }

      this.logger.warn(`Topic "${topic}" not found — creating it and retrying`);
      await this.createTopic(topic);

      return this.producer.send(record);
    }
  }

  private async createTopic(topic: string): Promise<void> {
    if (!this.kafka) {
      throw new Error('Kafka producer is not connected (KAFKA_ENABLED is false or the initial connect failed)');
    }

    const admin = this.kafka.admin();

    try {
      await admin.connect();
      // replicationFactor: -1 defers to the broker's own default, same as KafkaTopicsInitializer.
      await admin.createTopics({ waitForLeaders: true, topics: [{ topic, numPartitions: 1, replicationFactor: -1 }] });
    } catch (error) {
      this.logger.error(`Failed to create Kafka topic "${topic}": ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      await admin.disconnect();
    }
  }
}
