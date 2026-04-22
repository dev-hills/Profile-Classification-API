import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProfileSchema1776854635474 implements MigrationInterface {
  name = 'UpdateProfileSchema1776854635474';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "sample_size"`);
    await queryRunner.query(
      `ALTER TABLE "profile" ADD "country_name" character varying`,
    );

    await queryRunner.query(`
  UPDATE "profile"
  SET "country_name" = ''
`);

    await queryRunner.query(`
  ALTER TABLE "profile"
  ALTER COLUMN "country_name" SET NOT NULL
`);
    await queryRunner.query(
      `ALTER TABLE "profile" DROP CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb"`,
    );
    await queryRunner.query(`
  ALTER TABLE "profile"
  ALTER COLUMN "id" TYPE uuid
  USING id::uuid
`);
    await queryRunner.query(
      `ALTER TABLE "profile" ADD CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(`
  ALTER TABLE "profile"
  ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE
  USING created_at::timestamptz
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "profile" ADD "created_at" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile" DROP CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb"`,
    );
    await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "profile" ADD "id" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile" ADD CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "country_name"`);
    await queryRunner.query(
      `ALTER TABLE "profile" ADD "sample_size" integer NOT NULL`,
    );
  }
}
