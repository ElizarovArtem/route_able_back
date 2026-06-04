import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlatformSubscriptions1761650000000
  implements MigrationInterface
{
  name = 'CreatePlatformSubscriptions1761650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_plans_code_enum" AS ENUM('free','premium','pro')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_plans_period_enum" AS ENUM('month','year')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" "public"."subscription_plans_code_enum" NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "price" numeric(12,2) NOT NULL DEFAULT '0',
        "currency" character(3) NOT NULL DEFAULT 'RUB',
        "period" "public"."subscription_plans_period_enum" NOT NULL,
        "features" jsonb NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT '0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_plans_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_subscription_plans_code_period" ON "subscription_plans" ("code", "period")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_plans_is_active" ON "subscription_plans" ("isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_plans_sort_order" ON "subscription_plans" ("sortOrder")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."user_subscriptions_status_enum" AS ENUM('pending','trialing','active','past_due','canceled','expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "planId" uuid NOT NULL,
        "status" "public"."user_subscriptions_status_enum" NOT NULL DEFAULT 'pending',
        "startAt" TIMESTAMP WITH TIME ZONE,
        "endAt" TIMESTAMP WITH TIME ZONE,
        "trialEndsAt" TIMESTAMP WITH TIME ZONE,
        "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false,
        "canceledAt" TIMESTAMP WITH TIME ZONE,
        "externalCustomerId" character varying,
        "externalSubscriptionId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_subscriptions_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_subscriptions_user_id" ON "user_subscriptions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_subscriptions_status" ON "user_subscriptions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_subscriptions_end_at" ON "user_subscriptions" ("endAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_subscriptions_external_subscription_id" ON "user_subscriptions" ("externalSubscriptionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_user_subscriptions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_user_subscriptions_plan" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."subscription_payments_provider_enum" AS ENUM('stub','stripe','yookassa','cloudpayments','manual')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_payments_status_enum" AS ENUM('pending','succeeded','failed','canceled','refunded')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "userSubscriptionId" uuid,
        "provider" "public"."subscription_payments_provider_enum" NOT NULL DEFAULT 'stub',
        "status" "public"."subscription_payments_status_enum" NOT NULL DEFAULT 'pending',
        "amount" numeric(12,2) NOT NULL,
        "currency" character(3) NOT NULL DEFAULT 'RUB',
        "externalPaymentId" character varying,
        "externalInvoiceId" character varying,
        "paidAt" TIMESTAMP WITH TIME ZONE,
        "failureReason" text,
        "rawPayload" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_payments_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_payments_user_id" ON "subscription_payments" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_payments_user_subscription_id" ON "subscription_payments" ("userSubscriptionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_payments_provider" ON "subscription_payments" ("provider")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_payments_status" ON "subscription_payments" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_payments_external_payment_id" ON "subscription_payments" ("externalPaymentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_payments" ADD CONSTRAINT "FK_subscription_payments_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_payments" ADD CONSTRAINT "FK_subscription_payments_subscription" FOREIGN KEY ("userSubscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."feature_usage_feature_enum" AS ENUM('ai_chat','ai_food_logging','ai_photo_analysis','ai_workout_generation')`,
    );
    await queryRunner.query(
      `CREATE TABLE "feature_usage" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "feature" "public"."feature_usage_feature_enum" NOT NULL,
        "periodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
        "periodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used" integer NOT NULL DEFAULT '0',
        "limit" integer NOT NULL DEFAULT '0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feature_usage_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feature_usage_user_id" ON "feature_usage" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feature_usage_feature" ON "feature_usage" ("feature")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feature_usage_period_start" ON "feature_usage" ("periodStart")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feature_usage_period_end" ON "feature_usage" ("periodEnd")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_feature_usage_user_feature_period" ON "feature_usage" ("userId", "feature", "periodStart", "periodEnd")`,
    );
    await queryRunner.query(
      `ALTER TABLE "feature_usage" ADD CONSTRAINT "FK_feature_usage_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "feature_usage" DROP CONSTRAINT "FK_feature_usage_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_feature_usage_user_feature_period"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_feature_usage_period_end"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_feature_usage_period_start"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_feature_usage_feature"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_feature_usage_user_id"`);
    await queryRunner.query(`DROP TABLE "feature_usage"`);
    await queryRunner.query(`DROP TYPE "public"."feature_usage_feature_enum"`);

    await queryRunner.query(
      `ALTER TABLE "subscription_payments" DROP CONSTRAINT "FK_subscription_payments_subscription"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_payments" DROP CONSTRAINT "FK_subscription_payments_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscription_payments_external_payment_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscription_payments_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscription_payments_provider"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscription_payments_user_subscription_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscription_payments_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "subscription_payments"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscription_payments_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscription_payments_provider_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_user_subscriptions_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_user_subscriptions_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_subscriptions_external_subscription_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_subscriptions_end_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_subscriptions_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_subscriptions_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "user_subscriptions"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_subscriptions_status_enum"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscription_plans_sort_order"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscription_plans_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscription_plans_code_period"`,
    );
    await queryRunner.query(`DROP TABLE "subscription_plans"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscription_plans_period_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscription_plans_code_enum"`,
    );
  }
}
