import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWebPushNotificationChannel1788600000000 implements MigrationInterface {
  name = 'AddWebPushNotificationChannel1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "notification_configs_channel_enum" ADD VALUE IF NOT EXISTS 'WEB_PUSH'`);
  }

  public async down(): Promise<void> {
    // Postgres doesn't support dropping a value from an enum type, so this migration is irreversible.
  }
}
