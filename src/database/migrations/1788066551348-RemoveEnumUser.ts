import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEnumUser1788066551348 implements MigrationInterface {
  name = 'RemoveEnumUser1788066551348';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE varchar(16) USING "role"::varchar(16)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE enum_users_role USING "role"::enum_users_role`);
  }
}
