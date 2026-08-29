import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceChannelStates1788700000000 implements MigrationInterface {
  name = 'AddDeviceChannelStates1788700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" ADD "channel_states" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "channel_states"`);
  }
}
