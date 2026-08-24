import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceTemplateActionSchema1787500000000 implements MigrationInterface {
  name = 'AddDeviceTemplateActionSchema1787500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_templates" ADD "action_schema" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_templates" DROP COLUMN "action_schema"`);
  }
}
