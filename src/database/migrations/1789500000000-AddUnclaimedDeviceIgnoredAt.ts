import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnclaimedDeviceIgnoredAt1789500000000 implements MigrationInterface {
  name = 'AddUnclaimedDeviceIgnoredAt1789500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "unclaimed_devices" ADD "ignored_at" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "unclaimed_devices" DROP COLUMN "ignored_at"`);
  }
}
