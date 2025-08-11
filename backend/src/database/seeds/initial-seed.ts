import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { User, Doctor, Patient, QueueEntry, Appointment } from "../../entities";

export async function seedDatabase(dataSource: DataSource) {
  const allowReset = process.env.ALLOW_DB_RESET === 'true';
  const env = process.env.NODE_ENV || 'development';
  const destructiveEnv = ['production', 'staging'].includes(env) && allowReset;

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    if (allowReset) {
      console.log("🔧 Disabling foreign key checks (reset mode)...");
      await queryRunner.query("SET FOREIGN_KEY_CHECKS = 0;");
      const tables = ["appointments", "queue_entries", "patients", "doctors", "users"];
      for (const table of tables) {
        await queryRunner.query(`TRUNCATE TABLE ${table}`);
      }
      console.log("🧹 Cleared all tables due to ALLOW_DB_RESET=true.");
    } else {
      console.log("ℹ️ ALLOW_DB_RESET not set - performing idempotent seed (no destructive truncate).");
    }

    // ✅ Upsert default user (by username)
    const adminUsername = 'admin';
    let user = await dataSource.getRepository(User).findOne({ where: { username: adminUsername } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(
        process.env.SEED_ADMIN_PASSWORD || "admin123",
        10
      );
      user = dataSource.getRepository(User).create({
        username: adminUsername,
        passwordHash: hashedPassword,
        role: "front_desk",
      });
      await dataSource.getRepository(User).save(user);
      console.log("👤 Created admin user.");
    } else if (process.env.SEED_ADMIN_PASSWORD) {
      // Optional password rotate if explicit password provided
      user.passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 10);
      await dataSource.getRepository(User).save(user);
      console.log("🔐 Updated admin password.");
    } else {
      console.log("👤 Admin user already exists.");
    }

    // ✅ Sample doctors
    const doctors = [
      {
        name: "Dr. Sarah Johnson",
        specialization: "General Medicine",
        gender: "female",
        location: "Room 101",
        status: "available",
        availabilitySchedule: {
          monday: { start: "09:00", end: "17:00" },
          tuesday: { start: "09:00", end: "17:00" },
          wednesday: { start: "09:00", end: "17:00" },
          thursday: { start: "09:00", end: "17:00" },
          friday: { start: "09:00", end: "15:00" },
        },
      },
      {
        name: "Dr. Michael Chen",
        specialization: "Cardiology",
        gender: "male",
        location: "Room 102",
        status: "available",
        availabilitySchedule: {
          monday: { start: "10:00", end: "18:00" },
          tuesday: { start: "10:00", end: "18:00" },
          wednesday: { start: "10:00", end: "18:00" },
          thursday: { start: "10:00", end: "18:00" },
          friday: { start: "10:00", end: "16:00" },
        },
      },
      {
        name: "Dr. Emily Rodriguez",
        specialization: "Pediatrics",
        gender: "female",
        location: "Room 103",
        status: "busy",
        availabilitySchedule: {
          monday: { start: "08:00", end: "16:00" },
          tuesday: { start: "08:00", end: "16:00" },
          wednesday: { start: "08:00", end: "16:00" },
          thursday: { start: "08:00", end: "16:00" },
          friday: { start: "08:00", end: "14:00" },
        },
      },
      {
        name: "Dr. James Wilson",
        specialization: "Orthopedics",
        gender: "male",
        location: "Room 104",
        status: "off_duty",
        availabilitySchedule: {
          monday: { start: "11:00", end: "19:00" },
          tuesday: { start: "11:00", end: "19:00" },
          wednesday: { start: "11:00", end: "19:00" },
          thursday: { start: "11:00", end: "19:00" },
          friday: { start: "11:00", end: "17:00" },
        },
      },
    ];
    const doctorRepo = dataSource.getRepository(Doctor);
    const savedDoctors: Doctor[] = [];
    for (const doc of doctors) {
      let existing = await doctorRepo.findOne({ where: { name: doc.name, specialization: doc.specialization } });
      if (!existing) {
        existing = doctorRepo.create(doc);
        await doctorRepo.save(existing);
        console.log(`🩺 Added doctor ${doc.name}`);
      } else {
        // Merge status / schedule updates if changed
        let changed = false;
        if (JSON.stringify(existing.availabilitySchedule) !== JSON.stringify(doc.availabilitySchedule)) {
          existing.availabilitySchedule = doc.availabilitySchedule as any;
          changed = true;
        }
        if (existing.status !== doc.status) { existing.status = doc.status; changed = true; }
        if (existing.location !== doc.location) { existing.location = doc.location; changed = true; }
        if (changed) { await doctorRepo.save(existing); console.log(`♻️ Updated doctor ${doc.name}`); }
        else { console.log(`✔️ Doctor ${doc.name} unchanged`); }
      }
      savedDoctors.push(existing);
    }

    // ✅ Sample patients
    const patients = [
      { name: "John Smith", contactInfo: "john.smith@email.com, (555) 123-4567", medicalRecordNumber: "MR001" },
      { name: "Mary Johnson", contactInfo: "mary.johnson@email.com, (555) 234-5678", medicalRecordNumber: "MR002" },
      { name: "Robert Brown", contactInfo: "robert.brown@email.com, (555) 345-6789", medicalRecordNumber: "MR003" },
      { name: "Lisa Davis", contactInfo: "lisa.davis@email.com, (555) 456-7890", medicalRecordNumber: "MR004" },
      { name: "David Wilson", contactInfo: "david.wilson@email.com, (555) 567-8901", medicalRecordNumber: "MR005" },
      { name: "Jennifer Garcia", contactInfo: "jennifer.garcia@email.com, (555) 678-9012", medicalRecordNumber: "MR006" },
      { name: "Michael Martinez", contactInfo: "michael.martinez@email.com, (555) 789-0123", medicalRecordNumber: "MR007" },
      { name: "Sarah Anderson", contactInfo: "sarah.anderson@email.com, (555) 890-1234", medicalRecordNumber: "MR008" },
    ];
    const patientRepo = dataSource.getRepository(Patient);
    const savedPatients: Patient[] = [];
    for (const pat of patients) {
      let existing = await patientRepo.findOne({ where: { medicalRecordNumber: pat.medicalRecordNumber } });
      if (!existing) {
        existing = patientRepo.create(pat);
        await patientRepo.save(existing);
        console.log(`🧍 Added patient ${pat.name}`);
      } else {
        // Update contact info if changed
        if (existing.contactInfo !== pat.contactInfo) {
          existing.contactInfo = pat.contactInfo;
          await patientRepo.save(existing);
          console.log(`♻️ Updated patient ${pat.name}`);
        } else {
          console.log(`✔️ Patient ${pat.name} unchanged`);
        }
      }
      savedPatients.push(existing);
    }

    // ✅ Queue entries
    const queueEntries = [
      { patientId: savedPatients[0].id, queueNumber: 1, status: "waiting", priority: "normal", arrivalTime: new Date(Date.now() - 30 * 60 * 1000), estimatedWaitTime: 15 },
      { patientId: savedPatients[1].id, queueNumber: 2, status: "with_doctor", priority: "urgent", arrivalTime: new Date(Date.now() - 45 * 60 * 1000), estimatedWaitTime: 0 },
      { patientId: savedPatients[2].id, queueNumber: 3, status: "waiting", priority: "normal", arrivalTime: new Date(Date.now() - 15 * 60 * 1000), estimatedWaitTime: 25 },
      { patientId: savedPatients[3].id, queueNumber: 4, status: "waiting", priority: "urgent", arrivalTime: new Date(Date.now() - 10 * 60 * 1000), estimatedWaitTime: 5 },
    ];
    if (allowReset) {
      await dataSource.getRepository(QueueEntry).save(
        queueEntries.map((q) => dataSource.getRepository(QueueEntry).create(q))
      );
    } else {
      console.log("ℹ️ Skipping queueEntries reseed (non-destructive mode).");
    }

    // ✅ Appointments
    const now = new Date();
    const appointments = [
      { patientId: savedPatients[4].id, doctorId: savedDoctors[0].id, appointmentDatetime: new Date(now.getTime() + 2 * 60 * 60 * 1000), status: "booked", notes: "Regular checkup" },
      { patientId: savedPatients[5].id, doctorId: savedDoctors[1].id, appointmentDatetime: new Date(now.getTime() + 4 * 60 * 60 * 1000), status: "booked", notes: "Cardiology consultation" },
      { patientId: savedPatients[6].id, doctorId: savedDoctors[2].id, appointmentDatetime: new Date(now.getTime() + 24 * 60 * 60 * 1000), status: "booked", notes: "Pediatric examination" },
      { patientId: savedPatients[7].id, doctorId: savedDoctors[0].id, appointmentDatetime: new Date(now.getTime() - 24 * 60 * 60 * 1000), status: "completed", notes: "Follow-up visit completed" },
      { patientId: savedPatients[0].id, doctorId: savedDoctors[3].id, appointmentDatetime: new Date(now.getTime() + 48 * 60 * 60 * 1000), status: "canceled", notes: "Patient requested cancellation" },
    ];
    if (allowReset) {
      await dataSource.getRepository(Appointment).save(
        appointments.map((a) => dataSource.getRepository(Appointment).create(a))
      );
    } else {
      console.log("ℹ️ Skipping appointments reseed (non-destructive mode).
Add targeted appointment upsert logic here later if needed.");
    }

    await queryRunner.commitTransaction();

    console.log("\n✅ Database seeded successfully!");
    console.log("🔐 Login credentials:");
    console.log(`   Username: admin`);
    console.log(`   Password: ${process.env.SEED_ADMIN_PASSWORD || "admin123"}`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("❌ Error while seeding:", error);
    throw error;
  } finally {
    if (allowReset) {
      await queryRunner.query("SET FOREIGN_KEY_CHECKS = 1;");
      console.log("🔒 Foreign key checks re-enabled.");
    }
    await queryRunner.release();
  }
}
