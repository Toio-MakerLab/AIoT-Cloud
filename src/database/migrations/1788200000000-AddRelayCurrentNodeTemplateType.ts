import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds RELAY_CURRENT_NODE to device_templates.type — for relay templates whose
 * actionSchema channels are paired with a per-channel current sensor (e.g. ACS712),
 * distinct from a plain RELAY_NODE with no current sensing.
 */
export class AddRelayCurrentNodeTemplateType1788200000000 implements MigrationInterface {
  name = 'AddRelayCurrentNodeTemplateType1788200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."device_templates_type_enum" ADD VALUE IF NOT EXISTS 'RELAY_CURRENT_NODE'`);
  }

  public async down(): Promise<void> {
    // Postgres does not support removing a value from an enum type.
  }
}
