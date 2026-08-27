import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDevicePerDeviceSecret1787800000000 implements MigrationInterface {
  name = 'RemoveDevicePerDeviceSecret1787800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "secret_issued_at"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "device_secret_hash"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" ADD "device_secret_hash" character varying`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "secret_issued_at" TIMESTAMP`);
  }
}
