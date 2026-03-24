import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoachOrderUsageColumns1761000000000
  implements MigrationInterface
{
  name = 'AddCoachOrderUsageColumns1761000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coach_orders" ADD "sessionsUsed" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_orders" ADD "sessionsReserved" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coach_orders" DROP COLUMN "sessionsReserved"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_orders" DROP COLUMN "sessionsUsed"`,
    );
  }
}
