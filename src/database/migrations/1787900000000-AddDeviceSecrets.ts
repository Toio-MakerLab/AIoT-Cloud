import { createHash, randomUUID } from 'node:crypto';

import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceSecrets1787900000000 implements MigrationInterface {
  name = 'AddDeviceSecrets1787900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "device_secrets" (
        "id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "label" character varying,
        "secret_hash" character varying NOT NULL,
        "created_by_user_id" character varying NOT NULL,
        "revoked_at" TIMESTAMP,
        CONSTRAINT "UQ_device_secrets_secret_hash" UNIQUE ("secret_hash"),
        CONSTRAINT "PK_device_secrets" PRIMARY KEY ("id")
      )
    `);

    // One-time carry-over of the previous single shared secret (DEVICE_SHARED_SECRET env var),
    // if it was configured, so devices already provisioned with it keep working post-migration.
    const legacySecret = process.env.DEVICE_SHARED_SECRET;

    if (legacySecret) {
      const hash = createHash('sha256').update(legacySecret).digest('hex');

      await queryRunner.query(`INSERT INTO "device_secrets" ("id", "label", "secret_hash", "created_by_user_id") VALUES ($1, $2, $3, $4)`, [
        randomUUID(),
        'migrated-shared-secret',
        hash,
        'system',
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "device_secrets"`);
  }
}
