import { randomUUID } from 'node:crypto';

import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds a ready-to-use device template for an ESP32 relay controller with 2 relay
 * channels, each paired with its own ACS712 current sensor for load monitoring.
 * See docs/device-template-esp32-2relay-acs712-example.md for the full wiring/firmware guide.
 */
export class SeedRelay2ChAcs712Template1788100000000 implements MigrationInterface {
  name = 'SeedRelay2ChAcs712Template1788100000000';

  private readonly templateName = 'ESP32 Relay 2CH + ACS712';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`SELECT id FROM "device_templates" WHERE "name" = $1`, [this.templateName]);

    if (existing.length > 0) {
      return;
    }

    const telemetrySchema = [
      { key: 'relay1', label: 'Relay 1', unit: 'state' },
      { key: 'relay2', label: 'Relay 2', unit: 'state' },
      { key: 'rssi', label: 'WiFi Signal', unit: 'dBm' },
    ];

    const actionSchema = [
      { key: 'relay1', label: 'Relay 1', type: 'TOGGLE', onValue: 'ON', offValue: 'OFF' },
      { key: 'relay2', label: 'Relay 2', type: 'TOGGLE', onValue: 'ON', offValue: 'OFF' },
    ];

    await queryRunner.query(
      `INSERT INTO "device_templates" ("id", "name", "type", "description", "manufacturer", "telemetry_schema", "action_schema", "is_active")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        randomUUID(),
        this.templateName,
        'RELAY_NODE',
        'ESP32-based relay controller with 2 independently switched relay channels, each monitored by its own ACS712 current sensor.',
        'Espressif ESP32',
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
