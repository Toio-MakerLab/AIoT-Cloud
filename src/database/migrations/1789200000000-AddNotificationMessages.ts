import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationMessages1789200000000 implements MigrationInterface {
  name = 'AddNotificationMessages1789200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."notification_messages_channel_enum" AS ENUM('ZALO', 'WEB_PUSH')`);
    await queryRunner.query(`CREATE TYPE "public"."notification_messages_status_enum" AS ENUM('SENT', 'FAILED')`);
    await queryRunner.query(
      `CREATE TABLE "notification_messages" (
        "id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" character varying NOT NULL,
        "channel" "public"."notification_messages_channel_enum" NOT NULL,
        "message" text NOT NULL,
        "status" "public"."notification_messages_status_enum" NOT NULL,
        "error" text,
        "device_id" character varying,
        "is_read" boolean NOT NULL DEFAULT false,
        "read_at" TIMESTAMP,
        CONSTRAINT "PK_notification_messages_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_notification_messages_user_id" ON "notification_messages" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_notification_messages_device_id" ON "notification_messages" ("device_id")`);
    await queryRunner.query(
      `ALTER TABLE "notification_messages" ADD CONSTRAINT "FK_notification_messages_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notification_messages" DROP CONSTRAINT "FK_notification_messages_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notification_messages_device_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notification_messages_user_id"`);
    await queryRunner.query(`DROP TABLE "notification_messages"`);
    await queryRunner.query(`DROP TYPE "public"."notification_messages_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notification_messages_channel_enum"`);
  }
}
