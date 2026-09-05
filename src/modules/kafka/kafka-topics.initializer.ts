import type { OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { SASLOptions } from 'kafkajs';
import { Kafka } from 'kafkajs';

import {
  KAFKA_ALERT_TOPIC,
  KAFKA_COMMAND_TOPIC,
  KAFKA_DEVICE_EVENTS_TOPIC,
  KAFKA_GATEWAY_COMMANDS_TOPIC,
  KAFKA_GATEWAY_EVENTS_TOPIC,
  KAFKA_OTA_STATUS_TOPIC,
  KAFKA_STATUS_TOPIC,
  KAFKA_TELEMETRY_TOPIC,
} from '../../constants/kafka-topics.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';

/** Every shared topic this backend produces/consumes — see `docs/gateway-kafka-integration.md`. */
const MANAGED_TOPICS = [
  KAFKA_TELEMETRY_TOPIC,
  KAFKA_STATUS_TOPIC,
  KAFKA_COMMAND_TOPIC,
  KAFKA_GATEWAY_COMMANDS_TOPIC,
  KAFKA_GATEWAY_EVENTS_TOPIC,
  KAFKA_DEVICE_EVENTS_TOPIC,
  KAFKA_ALERT_TOPIC,
  KAFKA_OTA_STATUS_TOPIC,
];

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

      this.logger.log(`Creating missing Kafka topics: ${missingTopics.join(', ')}`);

      // replicationFactor: -1 defers to the broker's own default rather than assuming a
      // particular cluster size (dev single-broker vs. a managed multi-broker cluster).
      await admin.createTopics({
        waitForLeaders: true,
        topics: missingTopics.map((topic) => ({ topic, numPartitions: 1, replicationFactor: -1 })),
      });

      this.logger.log(`Created missing Kafka topics: ${missingTopics.join(', ')}`);
    } catch (error) {
      // Include the KafkaJS protocol error type/code (e.g. INVALID_TOPIC_EXCEPTION) alongside the
      // attempted topic names — some managed/emulated Kafka services reject admin-driven topic
      // creation outright (missing ACLs, or no CreateTopics support at all), in which case the
      // topics must be provisioned out-of-band and this failure is expected/non-fatal.
      const kafkaError = error as { type?: string; code?: number; message?: string };
      const detail = kafkaError?.type ? ` (${kafkaError.type}, code ${kafkaError.code})` : '';

      this.logger.error(
        `Failed to ensure Kafka topics exist [${MANAGED_TOPICS.join(', ')}]: ${error instanceof Error ? error.message : String(error)}${detail}`,
      );
    } finally {
      await admin.disconnect();
    }
  }
}
