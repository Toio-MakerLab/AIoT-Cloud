import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceProvisioningConfig1787400000000 implements MigrationInterface {
  name = 'AddDeviceProvisioningConfig1787400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."devices_push_channel_enum" AS ENUM('MQTT', 'HTTP', 'KAFKA')`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "device_secret_hash" character varying`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "secret_issued_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "push_channel" "public"."devices_push_channel_enum" NOT NULL DEFAULT 'MQTT'`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "config" jsonb`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "config_version" integer NOT NULL DEFAULT 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "config_version"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "config"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "push_channel"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "secret_issued_at"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "device_secret_hash"`);
    await queryRunner.query(`DROP TYPE "public"."devices_push_channel_enum"`);
  }
}
