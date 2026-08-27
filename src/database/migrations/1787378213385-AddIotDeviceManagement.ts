import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIotDeviceManagement1787378213385 implements MigrationInterface {
  name = 'AddIotDeviceManagement1787378213385';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."device_templates_type_enum" AS ENUM('SENSOR_NODE', 'RELAY_NODE', 'GATEWAY', 'OTHER')`);
    await queryRunner.query(
      `CREATE TABLE "device_templates" ("id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "type" "public"."device_templates_type_enum" NOT NULL DEFAULT 'OTHER', "description" character varying, "manufacturer" character varying, "icon" character varying, "telemetry_schema" jsonb, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_bb935b8cf38a05dda256987548e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "devices" ("id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "device_id" character varying NOT NULL, "name" character varying NOT NULL, "template_id" character varying NOT NULL, "user_id" character varying NOT NULL, "last_seen_at" TIMESTAMP, "metadata" jsonb, CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2667f40edb344d6f274a0d42b6" ON "devices" ("device_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_5e9bee993b4ce35c3606cda194" ON "devices" ("user_id") `);
    await queryRunner.query(
      `CREATE TABLE "device_telemetry" ("id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "device_id" character varying NOT NULL, "payload" jsonb NOT NULL, "recorded_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_5f9bf90c963405eac930d5733ed" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_64b7753e53da4770c4a9089a38" ON "device_telemetry" ("device_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_c1af91fb612200a447602853be" ON "device_telemetry" ("recorded_at") `);
    await queryRunner.query(
      `CREATE TABLE "dashboards" ("id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" character varying NOT NULL, "name" character varying NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "widgets" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "PK_1b4b4bc346118e0d335f16c5344" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_0be338738cc41d6eec23629b822" FOREIGN KEY ("template_id") REFERENCES "device_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_5e9bee993b4ce35c3606cda194c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_telemetry" ADD CONSTRAINT "FK_64b7753e53da4770c4a9089a380" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_telemetry" DROP CONSTRAINT "FK_64b7753e53da4770c4a9089a380"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_5e9bee993b4ce35c3606cda194c"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_0be338738cc41d6eec23629b822"`);
    await queryRunner.query(`DROP TABLE "dashboards"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c1af91fb612200a447602853be"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_64b7753e53da4770c4a9089a38"`);
    await queryRunner.query(`DROP TABLE "device_telemetry"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5e9bee993b4ce35c3606cda194"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2667f40edb344d6f274a0d42b6"`);
    await queryRunner.query(`DROP TABLE "devices"`);
    await queryRunner.query(`DROP TABLE "device_templates"`);
    await queryRunner.query(`DROP TYPE "public"."device_templates_type_enum"`);
  }
}
