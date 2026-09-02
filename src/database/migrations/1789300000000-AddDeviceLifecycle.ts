import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceLifecycle1789300000000 implements MigrationInterface {
  name = 'AddDeviceLifecycle1789300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" ADD "installed_at" timestamp`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "expected_lifespan_months" integer`);
    // Plain varchar, not a Postgres enum type — DeviceLifecycleStage validates the value in code,
    // so adding/renaming a stage never needs an `ALTER TYPE` migration.
    await queryRunner.query(`ALTER TABLE "devices" ADD "lifecycle_stage" character varying NOT NULL DEFAULT 'NEW'`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "lifecycle_score" integer`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "lifecycle_assessed_at" timestamp`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "decommissioned_at" timestamp`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "decommissioned_at"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "lifecycle_assessed_at"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "lifecycle_score"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "lifecycle_stage"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "expected_lifespan_months"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "installed_at"`);
  }
}
