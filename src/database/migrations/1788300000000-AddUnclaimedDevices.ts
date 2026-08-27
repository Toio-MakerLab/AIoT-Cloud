import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnclaimedDevices1788300000000 implements MigrationInterface {
  name = 'AddUnclaimedDevices1788300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "unclaimed_devices" (
        "id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "device_id" character varying NOT NULL,
        "last_topic" character varying NOT NULL,
        "last_payload" text,
        "last_seen_at" TIMESTAMP NOT NULL,
        CONSTRAINT "UQ_unclaimed_devices_device_id" UNIQUE ("device_id"),
        CONSTRAINT "PK_unclaimed_devices" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "unclaimed_devices"`);
  }
}
