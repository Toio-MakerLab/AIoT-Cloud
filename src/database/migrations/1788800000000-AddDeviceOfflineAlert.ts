import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceOfflineAlert1788800000000 implements MigrationInterface {
  name = 'AddDeviceOfflineAlert1788800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" ADD "offline_alert" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "offline_alert"`);
  }
}
