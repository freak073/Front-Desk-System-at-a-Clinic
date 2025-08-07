import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1704067200000 implements MigrationInterface {
  name = 'CreateInitialTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`username\` varchar(50) NOT NULL,
        \`password_hash\` varchar(255) NOT NULL,
        \`role\` enum('front_desk') NOT NULL DEFAULT 'front_desk',
        \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create doctors table
    await queryRunner.query(`
      CREATE TABLE \`doctors\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        \`specialization\` varchar(100) NOT NULL,
        \`gender\` enum('male', 'female', 'other') NOT NULL,
        \`location\` varchar(100) NOT NULL,
        \`availability_schedule\` json NULL,
        \`status\` enum('available', 'busy', 'off_duty') NOT NULL DEFAULT 'available',
        \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create patients table
    await queryRunner.query(`
      CREATE TABLE \`patients\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        \`contact_info\` varchar(255) NULL,
        \`medical_record_number\` varchar(50) NULL,
        \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_medical_record_number\` (\`medical_record_number\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create queue_entries table
    await queryRunner.query(`
      CREATE TABLE \`queue_entries\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`patient_id\` int NOT NULL,
        \`queue_number\` int NOT NULL,
        \`status\` enum('waiting', 'with_doctor', 'completed') NOT NULL DEFAULT 'waiting',
        \`priority\` enum('normal', 'urgent') NOT NULL DEFAULT 'normal',
        \`arrival_time\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`estimated_wait_time\` int NULL COMMENT 'Estimated wait time in minutes',
        \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_queue_number\` (\`queue_number\`),
        INDEX \`IDX_status\` (\`status\`),
        INDEX \`IDX_priority\` (\`priority\`),
        INDEX \`IDX_arrival_time\` (\`arrival_time\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create appointments table
    await queryRunner.query(`
      CREATE TABLE \`appointments\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`patient_id\` int NOT NULL,
        \`doctor_id\` int NOT NULL,
        \`appointment_datetime\` datetime NOT NULL,
        \`status\` enum('booked', 'completed', 'canceled') NOT NULL DEFAULT 'booked',
        \`notes\` text NULL,
        \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_appointment_datetime\` (\`appointment_datetime\`),
        INDEX \`IDX_doctor_datetime\` (\`doctor_id\`, \`appointment_datetime\`),
        INDEX \`IDX_patient_id\` (\`patient_id\`),
        INDEX \`IDX_appointment_status\` (\`status\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE \`queue_entries\` 
      ADD CONSTRAINT \`FK_queue_entries_patient\` 
      FOREIGN KEY (\`patient_id\`) REFERENCES \`patients\`(\`id\`) 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`appointments\` 
      ADD CONSTRAINT \`FK_appointments_patient\` 
      FOREIGN KEY (\`patient_id\`) REFERENCES \`patients\`(\`id\`) 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`appointments\` 
      ADD CONSTRAINT \`FK_appointments_doctor\` 
      FOREIGN KEY (\`doctor_id\`) REFERENCES \`doctors\`(\`id\`) 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_appointments_doctor\``);
    await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_appointments_patient\``);
    await queryRunner.query(`ALTER TABLE \`queue_entries\` DROP FOREIGN KEY \`FK_queue_entries_patient\``);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE \`appointments\``);
    await queryRunner.query(`DROP TABLE \`queue_entries\``);
    await queryRunner.query(`DROP TABLE \`patients\``);
    await queryRunner.query(`DROP TABLE \`doctors\``);
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}