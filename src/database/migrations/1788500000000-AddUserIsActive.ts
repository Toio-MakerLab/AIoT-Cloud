import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIsActive1788500000000 implements MigrationInterface {
  name = 'AddUserIsActive1788500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_settings" ADD "is_active" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN "is_active"`);
  }
}
