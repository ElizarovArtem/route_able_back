import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedback1761000001001 implements MigrationInterface {
  name = 'CreateFeedback1761000001001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."feedback_type_enum" AS ENUM('bug','idea','complaint','praise','other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."feedback_status_enum" AS ENUM('pending','sent','failed')`,
    );
    await queryRunner.query(`
      CREATE TABLE "feedback" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "type" "public"."feedback_type_enum" NOT NULL,
        "message" text NOT NULL,
        "page" character varying(500),
        "email" character varying(255),
        "telegram" character varying(100),
        "meta" jsonb,
        "status" "public"."feedback_status_enum" NOT NULL DEFAULT 'pending',
        "telegramMessageId" character varying(255),
        "deliveryError" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_8389f0c28be4f4b3a5c9ee9c5c3" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "i_feedback_created_at" ON "feedback" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "i_feedback_status" ON "feedback" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "i_feedback_type" ON "feedback" ("type")`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback" ADD CONSTRAINT "FK_feedback_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "feedback" DROP CONSTRAINT "FK_feedback_user"`,
    );
    await queryRunner.query(`DROP INDEX "public"."i_feedback_type"`);
    await queryRunner.query(`DROP INDEX "public"."i_feedback_status"`);
    await queryRunner.query(`DROP INDEX "public"."i_feedback_created_at"`);
    await queryRunner.query(`DROP TABLE "feedback"`);
    await queryRunner.query(`DROP TYPE "public"."feedback_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."feedback_type_enum"`);
  }
}
