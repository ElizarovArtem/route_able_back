import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoLessons1760808961456 implements MigrationInterface {
  name = 'AddVideoLessons1760808961456';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."video_lessons_status_enum" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "video_lessons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientCoachId" uuid NOT NULL, "clientId" uuid NOT NULL, "coachId" uuid NOT NULL, "startAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."video_lessons_status_enum" NOT NULL DEFAULT 'SCHEDULED', "title" text, "notes" text, "createdBy" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a0dd3feb56b27c471b7b3108044" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "i_lesson_by_pair_time" ON "video_lessons" ("clientCoachId", "startAt", "endAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "video_lessons" ADD CONSTRAINT "FK_34a68b1821ef110dd279e1d99cb" FOREIGN KEY ("clientCoachId") REFERENCES "client_coach"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_lessons" ADD CONSTRAINT "FK_c50c08feb3ec07d8df22be2529b" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_lessons" ADD CONSTRAINT "FK_d004f88d7ad29e7024b2df5dd0e" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "video_lessons" DROP CONSTRAINT "FK_d004f88d7ad29e7024b2df5dd0e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_lessons" DROP CONSTRAINT "FK_c50c08feb3ec07d8df22be2529b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_lessons" DROP CONSTRAINT "FK_34a68b1821ef110dd279e1d99cb"`,
    );
    await queryRunner.query(`DROP INDEX "public"."i_lesson_by_pair_time"`);
    await queryRunner.query(`DROP TABLE "video_lessons"`);
    await queryRunner.query(`DROP TYPE "public"."video_lessons_status_enum"`);
  }
}
