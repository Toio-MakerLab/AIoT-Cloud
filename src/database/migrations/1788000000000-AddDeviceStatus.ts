import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceStatus1788000000000 implements MigrationInterface {
  name = 'AddDeviceStatus1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."devices_status_enum" AS ENUM('ONLINE', 'OFFLINE')`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "status" "public"."devices_status_enum" NOT NULL DEFAULT 'OFFLINE'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."devices_status_enum"`);
  }
}
