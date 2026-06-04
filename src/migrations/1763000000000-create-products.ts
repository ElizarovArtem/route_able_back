import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducts1763000000000 implements MigrationInterface {
  name = 'CreateProducts1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "barcode" character varying(32) NOT NULL,
        "name" character varying(500) NOT NULL,
        "brand" character varying(255),
        "imageUrl" text,
        "servingSize" numeric(10,2),
        "servingUnit" character varying(32),
        "caloriesPer100g" numeric(10,2) NOT NULL,
        "proteinPer100g" numeric(10,2) NOT NULL,
        "fatPer100g" numeric(10,2) NOT NULL,
        "carbsPer100g" numeric(10,2) NOT NULL,
        "source" character varying(64) NOT NULL,
        "rawExternalData" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_products_barcode" ON "products" ("barcode")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."uq_products_barcode"`);
    await queryRunner.query(`DROP TABLE "products"`);
  }
}
