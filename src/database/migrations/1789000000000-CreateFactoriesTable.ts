import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFactoriesTable1789000000000 implements MigrationInterface {
  name = 'CreateFactoriesTable1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "factories" (
        "id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "address" character varying,
        "description" character varying,
        CONSTRAINT "UQ_factories_name" UNIQUE ("name"),
        CONSTRAINT "PK_factories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`ALTER TABLE "users" ADD "factory_id" character varying`);
    await queryRunner.query(`CREATE INDEX "IDX_users_factory_id" ON "users" ("factory_id")`);

    await queryRunner.query(`ALTER TABLE "devices" ADD "factory_id" character varying`);
    await queryRunner.query(`CREATE INDEX "IDX_devices_factory_id" ON "devices" ("factory_id")`);

    await queryRunner.query(`ALTER TABLE "dashboards" ADD "factory_id" character varying`);
    await queryRunner.query(`CREATE INDEX "IDX_dashboards_factory_id" ON "dashboards" ("factory_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_dashboards_factory_id"`);
    await queryRunner.query(`ALTER TABLE "dashboards" DROP COLUMN "factory_id"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_devices_factory_id"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "factory_id"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_users_factory_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "factory_id"`);

    await queryRunner.query(`DROP TABLE "factories"`);
  }
}
