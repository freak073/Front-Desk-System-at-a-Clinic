import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1703000000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Appointments table indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_datetime 
      ON appointments (appointment_datetime)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_doctor_datetime 
      ON appointments (doctor_id, appointment_datetime)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_patient_datetime 
      ON appointments (patient_id, appointment_datetime)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_status_datetime 
      ON appointments (status, appointment_datetime)
    `);

    // Queue entries indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_queue_entries_status_arrival 
      ON queue_entries (status, arrival_time)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_queue_entries_priority_arrival 
      ON queue_entries (priority, arrival_time)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_number 
      ON queue_entries (queue_number)
    `);

    // Doctors table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_doctors_specialization 
      ON doctors (specialization)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_doctors_status 
      ON doctors (status)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_doctors_location 
      ON doctors (location)
    `);

    // Patients table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_name 
      ON patients (name)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_medical_record 
      ON patients (medical_record_number)
    `);

    // Composite indexes for common query patterns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_doctor_status_datetime 
      ON appointments (doctor_id, status, appointment_datetime)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_queue_entries_status_priority_arrival 
      ON queue_entries (status, priority, arrival_time)
    `);

    // Full-text search indexes for name searches
    await queryRunner.query(`
      CREATE FULLTEXT INDEX IF NOT EXISTS idx_patients_name_fulltext 
      ON patients (name)
    `);
    
    await queryRunner.query(`
      CREATE FULLTEXT INDEX IF NOT EXISTS idx_doctors_name_fulltext 
      ON doctors (name)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all the indexes we created
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointments_datetime ON appointments`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointments_doctor_datetime ON appointments`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointments_patient_datetime ON appointments`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointments_status_datetime ON appointments`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS idx_queue_entries_status_arrival ON queue_entries`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_queue_entries_priority_arrival ON queue_entries`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_queue_entries_queue_number ON queue_entries`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS idx_doctors_specialization ON doctors`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_doctors_status ON doctors`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_doctors_location ON doctors`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS idx_patients_name ON patients`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_patients_medical_record ON patients`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointments_doctor_status_datetime ON appointments`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_queue_entries_status_priority_arrival ON queue_entries`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS idx_patients_name_fulltext ON patients`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_doctors_name_fulltext ON doctors`);
  }
}