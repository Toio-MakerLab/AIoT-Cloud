import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1787381039053 implements MigrationInterface {
  name = 'AddEmailVerification1787381039053';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_settings" ADD "email_verification_token" character varying`);
    await queryRunner.query(`ALTER TABLE "user_settings" ADD "email_verification_token_expires_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710"`);
    await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN "email_verification_token_expires_at"`);
    await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN "email_verification_token"`);
  }
}
