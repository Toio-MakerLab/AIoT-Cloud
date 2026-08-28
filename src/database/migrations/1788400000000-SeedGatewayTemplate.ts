import { randomUUID } from 'node:crypto';

import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds a device template for `aiot-gate` itself. The gateway registers as an ordinary
 * device against this template so its own health (uptime, bridged-device count, etc.) is
 * visible on the Devices page like any other device, using the same Kafka telemetry/status
 * uplink described in docs/gateway-kafka-integration.md.
 */
export class SeedGatewayTemplate1788400000000 implements MigrationInterface {
  name = 'SeedGatewayTemplate1788400000000';

  private readonly templateName = 'AIoT Gateway';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`SELECT id FROM "device_templates" WHERE "name" = $1`, [this.templateName]);

    if (existing.length > 0) {
      return;
    }

    const telemetrySchema = [
      { key: 'uptimeSeconds', label: 'Uptime', unit: 's' },
      { key: 'bridgedDeviceCount', label: 'Bridged Devices', unit: 'count' },
      { key: 'cpuLoadPercent', label: 'CPU Load', unit: '%', warningMin: 0, warningMax: 90 },
      { key: 'memoryUsagePercent', label: 'Memory Usage', unit: '%', warningMin: 0, warningMax: 90 },
      { key: 'kafkaConnected', label: 'Kafka Connection', unit: 'state' },
    ];

    const actionSchema = [{ key: 'restart', label: 'Restart Gateway', type: 'BUTTON', onValue: 'RESTART' }];

    await queryRunner.query(
      `INSERT INTO "device_templates" ("id", "name", "type", "description", "manufacturer", "telemetry_schema", "action_schema", "is_active")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        randomUUID(),
        this.templateName,
        'GATEWAY',
        'Local gateway bridging devices on a private MQTT broker to the cloud over Kafka. Reports its own health as telemetry rather than sensor/relay data.',
        'Toio Marker Lab',
        JSON.stringify(telemetrySchema),
        JSON.stringify(actionSchema),
        true,
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "device_templates" WHERE "name" = $1`, [this.templateName]);
  }
}
