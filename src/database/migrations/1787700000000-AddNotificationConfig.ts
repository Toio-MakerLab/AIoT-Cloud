import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationConfig1787700000000 implements MigrationInterface {
  name = 'AddNotificationConfig1787700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."notification_configs_channel_enum" AS ENUM('ZALO')`);
    await queryRunner.query(
      `CREATE TABLE "notification_configs" (
        "id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" character varying NOT NULL,
        "channel" "public"."notification_configs_channel_enum" NOT NULL,
        "config" jsonb,
        "message_template" text,
        "is_enabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_notification_configs_user_channel" UNIQUE ("user_id", "channel"),
        CONSTRAINT "PK_notification_configs_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_notification_configs_user_id" ON "notification_configs" ("user_id")`);
    await queryRunner.query(
      `ALTER TABLE "notification_configs" ADD CONSTRAINT "FK_notification_configs_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`ALTER TABLE "devices" ADD "warning_overrides" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "warning_overrides"`);

    await queryRunner.query(`ALTER TABLE "notification_configs" DROP CONSTRAINT "FK_notification_configs_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notification_configs_user_id"`);
    await queryRunner.query(`DROP TABLE "notification_configs"`);
    await queryRunner.query(`DROP TYPE "public"."notification_configs_channel_enum"`);
  }
}
