import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserRoleEnum1704067200001 implements MigrationInterface {
  name = "UpdateUserRoleEnum1704067200001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update any existing 'front_desk' role values to 'staff'
    await queryRunner.query(`
      UPDATE \`users\` SET \`role\` = 'staff' WHERE \`role\` = 'front_desk'
    `);

    // Add the full_name column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      ADD COLUMN \`full_name\` varchar(100) NULL
    `);

    // Now update the enum to include the new values
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      CHANGE \`role\` \`role\` enum('admin', 'staff') NOT NULL DEFAULT 'staff'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the enum back to the original
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      CHANGE \`role\` \`role\` enum('front_desk') NOT NULL DEFAULT 'front_desk'
    `);

    // Update any 'staff' or 'admin' role values back to 'front_desk'
    await queryRunner.query(`
      UPDATE \`users\` SET \`role\` = 'front_desk' WHERE \`role\` IN ('admin', 'staff')
    `);

    // Remove the full_name column
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      DROP COLUMN \`full_name\`
    `);
  }
}
