import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceIsActive1787600000000 implements MigrationInterface {
  name = 'AddDeviceIsActive1787600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" ADD "is_active" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "is_active"`);
  }
}
