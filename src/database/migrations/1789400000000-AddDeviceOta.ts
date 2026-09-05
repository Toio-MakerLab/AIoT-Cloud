import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceOta1789400000000 implements MigrationInterface {
  name = 'AddDeviceOta1789400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "firmwares" (
        "id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "template_id" character varying NOT NULL,
        "version" character varying NOT NULL,
        "file_url" character varying NOT NULL,
        "checksum" character varying,
        "size_bytes" integer,
        "release_notes" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" character varying NOT NULL,
        CONSTRAINT "PK_firmwares" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_firmwares_template_id" ON "firmwares" ("template_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_firmwares_created_by" ON "firmwares" ("created_by")`);
    await queryRunner.query(
      `ALTER TABLE "firmwares" ADD CONSTRAINT "FK_firmwares_template_id" FOREIGN KEY ("template_id") REFERENCES "device_templates"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(`
      CREATE TABLE "device_ota_updates" (
        "id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "device_id" character varying NOT NULL,
        "firmware_id" character varying,
        "from_version" character varying,
        "to_version" character varying NOT NULL,
        "status" character varying NOT NULL,
        "progress" integer,
        "error" character varying,
        "requested_at" TIMESTAMP NOT NULL,
        "started_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        CONSTRAINT "PK_device_ota_updates" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_device_ota_updates_device_id" ON "device_ota_updates" ("device_id")`);
    await queryRunner.query(
      `ALTER TABLE "device_ota_updates" ADD CONSTRAINT "FK_device_ota_updates_device_id" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_ota_updates" ADD CONSTRAINT "FK_device_ota_updates_firmware_id" FOREIGN KEY ("firmware_id") REFERENCES "firmwares"("id") ON DELETE SET NULL`,
    );

    await queryRunner.query(`ALTER TABLE "devices" ADD "firmware_version" character varying`);
    // Plain varchar, not a Postgres enum type — DeviceOtaStatus validates the value in code, same
    // reasoning as "lifecycle_stage" (see AddDeviceLifecycle migration).
    await queryRunner.query(`ALTER TABLE "devices" ADD "ota_status" character varying NOT NULL DEFAULT 'IDLE'`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "ota_firmware_id" character varying`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "ota_target_version" character varying`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "ota_progress" integer`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "ota_error" character varying`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "ota_requested_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "ota_updated_at" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "ota_updated_at"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "ota_requested_at"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "ota_error"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "ota_progress"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "ota_target_version"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "ota_firmware_id"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "ota_status"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "firmware_version"`);

    await queryRunner.query(`ALTER TABLE "device_ota_updates" DROP CONSTRAINT "FK_device_ota_updates_firmware_id"`);
    await queryRunner.query(`ALTER TABLE "device_ota_updates" DROP CONSTRAINT "FK_device_ota_updates_device_id"`);
    await queryRunner.query(`DROP TABLE "device_ota_updates"`);

    await queryRunner.query(`ALTER TABLE "firmwares" DROP CONSTRAINT "FK_firmwares_template_id"`);
    await queryRunner.query(`DROP TABLE "firmwares"`);
  }
}
