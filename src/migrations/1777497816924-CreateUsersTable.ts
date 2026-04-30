import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1777497816924 implements MigrationInterface {
    name = 'CreateUsersTable1777497816924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'analyst')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL, "github_id" character varying NOT NULL, "username" character varying NOT NULL, "email" character varying, "avatar_url" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'analyst', "is_active" boolean NOT NULL DEFAULT true, "last_login_at" TIMESTAMP WITH TIME ZONE, "refresh_token_hash" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_09a2296ade1053a0cc4080bda4a" UNIQUE ("github_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "created_at" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
