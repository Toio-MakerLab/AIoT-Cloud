import type { OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { SASLOptions } from 'kafkajs';
import { Kafka } from 'kafkajs';

import { KAFKA_COMMAND_TOPIC, KAFKA_DEVICE_EVENTS_TOPIC, KAFKA_STATUS_TOPIC, KAFKA_TELEMETRY_TOPIC } from '../../constants/kafka-topics.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';

/** Every shared topic this backend produces/consumes — see `docs/gateway-kafka-integration.md`. */
const MANAGED_TOPICS = [KAFKA_TELEMETRY_TOPIC, KAFKA_STATUS_TOPIC, KAFKA_COMMAND_TOPIC, KAFKA_DEVICE_EVENTS_TOPIC];

/**
 * Creates the shared gateway<->cloud topics on boot if they don't already exist. Most managed
 * Kafka clusters run with `auto.create.topics.enable=false`, so without this, a topic nobody's
 * created manually would silently blackhole publishes (and a consumer would just never see
 * traffic) instead of failing loudly — this makes a fresh environment work out of the box.
 * Best-effort: failures (e.g. the configured credentials lack topic-create ACLs) are logged, not
 * fatal, since the topics may simply already exist under a different admin identity.
 */
@Injectable()
export class KafkaTopicsInitializer implements OnModuleInit {
  private readonly logger = new Logger(KafkaTopicsInitializer.name);

  constructor(private readonly apiConfigService: ApiConfigService) {}

  async onModuleInit(): Promise<void> {
    if (!this.apiConfigService.kafkaEnabled) {
      return;
    }

    const { brokers, clientId, ssl, sasl } = this.apiConfigService.kafkaConfig;

    const kafka = new Kafka({
      clientId: `${clientId}-topic-init`,
      brokers: brokers.split(','),
      ssl,
      sasl: sasl as SASLOptions | undefined,
    });

    const admin = kafka.admin();

    try {
      await admin.connect();

      const existingTopics = await admin.listTopics();
      const missingTopics = MANAGED_TOPICS.filter((topic) => !existingTopics.includes(topic));

      if (missingTopics.length === 0) {
        return;
      }

      // replicationFactor: -1 defers to the broker's own default rather than assuming a
      // particular cluster size (dev single-broker vs. a managed multi-broker cluster).
      await admin.createTopics({
        waitForLeaders: true,
        topics: missingTopics.map((topic) => ({ topic, numPartitions: 1, replicationFactor: -1 })),
      });

      this.logger.log(`Created missing Kafka topics: ${missingTopics.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to ensure Kafka topics exist: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await admin.disconnect();
    }
  }
}
