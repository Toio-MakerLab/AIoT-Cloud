import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceAlertRulesAndFailsafe1788900000000 implements MigrationInterface {
  name = 'AddDeviceAlertRulesAndFailsafe1788900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" ADD "alert_rules" jsonb`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "failsafe" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "failsafe"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "alert_rules"`);
  }
}
