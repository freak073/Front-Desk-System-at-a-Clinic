import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";
import { User, Doctor, Patient, QueueEntry, Appointment } from "../../entities";

// --- Data sets -------------------------------------------------------------
const DOCTORS_SEED: Partial<Doctor>[] = [
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

const PATIENTS_SEED: Partial<Patient>[] = [
  {
    name: "John Smith",
    contactInfo: "john.smith@email.com, (555) 123-4567",
    medicalRecordNumber: "MR001",
  },
  {
    name: "Mary Johnson",
    contactInfo: "mary.johnson@email.com, (555) 234-5678",
    medicalRecordNumber: "MR002",
  },
  {
    name: "Robert Brown",
    contactInfo: "robert.brown@email.com, (555) 345-6789",
    medicalRecordNumber: "MR003",
  },
  {
    name: "Lisa Davis",
    contactInfo: "lisa.davis@email.com, (555) 456-7890",
    medicalRecordNumber: "MR004",
  },
  {
    name: "David Wilson",
    contactInfo: "david.wilson@email.com, (555) 567-8901",
    medicalRecordNumber: "MR005",
  },
  {
    name: "Jennifer Garcia",
    contactInfo: "jennifer.garcia@email.com, (555) 678-9012",
    medicalRecordNumber: "MR006",
  },
  {
    name: "Michael Martinez",
    contactInfo: "michael.martinez@email.com, (555) 789-0123",
    medicalRecordNumber: "MR007",
  },
  {
    name: "Sarah Anderson",
    contactInfo: "sarah.anderson@email.com, (555) 890-1234",
    medicalRecordNumber: "MR008",
  },
];

async function seedUsers(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);

  // Create admin user
  const adminUsername = "admin";
  let adminUser = await userRepo.findOne({
    where: { username: adminUsername },
  });
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash(
      process.env.SEED_ADMIN_PASSWORD || "Admin123",
      10,
    );
    adminUser = userRepo.create({
      username: adminUsername,
      passwordHash: hashedPassword,
      role: "admin",
      fullName: "System Administrator",
    });
    await userRepo.save(adminUser);
    console.log("👤 Created admin user.");
  } else if (process.env.SEED_ADMIN_PASSWORD) {
    adminUser.passwordHash = await bcrypt.hash(
      process.env.SEED_ADMIN_PASSWORD,
      10,
    );
    await userRepo.save(adminUser);
    console.log("🔐 Updated admin password.");
  } else {
    console.log("👤 Admin user already exists.");
  }

  // Create staff user
  const staffUsername = "staff";
  let staffUser = await userRepo.findOne({
    where: { username: staffUsername },
  });
  if (!staffUser) {
    const hashedPassword = await bcrypt.hash(
      process.env.SEED_STAFF_PASSWORD || "Staff123",
      10,
    );
    staffUser = userRepo.create({
      username: staffUsername,
      passwordHash: hashedPassword,
      role: "staff",
      fullName: "Front Desk Staff",
    });
    await userRepo.save(staffUser);
    console.log("👤 Created staff user.");
  } else if (process.env.SEED_STAFF_PASSWORD) {
    staffUser.passwordHash = await bcrypt.hash(
      process.env.SEED_STAFF_PASSWORD,
      10,
    );
    await userRepo.save(staffUser);
    console.log("🔐 Updated staff password.");
  } else {
    console.log("👤 Staff user already exists.");
  }
}

async function seedDoctors(dataSource: DataSource): Promise<Doctor[]> {
  const repo = dataSource.getRepository(Doctor);
  const saved: Doctor[] = [];
  for (const doc of DOCTORS_SEED) {
    let existing = await repo.findOne({
      where: { name: doc.name, specialization: doc.specialization },
    });
    if (!existing) {
      existing = repo.create(doc);
      await repo.save(existing);
      console.log(`🩺 Added doctor ${doc.name}`);
    } else {
      let changed = false;
      if (
        JSON.stringify(existing.availabilitySchedule) !==
        JSON.stringify(doc.availabilitySchedule)
      ) {
        existing.availabilitySchedule = doc.availabilitySchedule as any;
        changed = true;
      }
      if (existing.status !== doc.status) {
        existing.status = doc.status!;
        changed = true;
      }
      if (existing.location !== doc.location) {
        existing.location = doc.location!;
        changed = true;
      }
      if (changed) {
        await repo.save(existing);
        console.log(`♻️ Updated doctor ${doc.name}`);
      } else {
        console.log(`✔️ Doctor ${doc.name} unchanged`);
      }
    }
    saved.push(existing);
  }
  return saved;
}

async function seedPatients(dataSource: DataSource): Promise<Patient[]> {
  const repo = dataSource.getRepository(Patient);
  const saved: Patient[] = [];
  for (const pat of PATIENTS_SEED) {
    let existing = await repo.findOne({
      where: { medicalRecordNumber: pat.medicalRecordNumber },
    });
    if (!existing) {
      existing = repo.create(pat);
      await repo.save(existing);
      console.log(`🧍 Added patient ${pat.name}`);
    } else if (existing.contactInfo !== pat.contactInfo) {
      existing.contactInfo = pat.contactInfo!;
      await repo.save(existing);
      console.log(`♻️ Updated patient ${pat.name}`);
    } else {
      console.log(`✔️ Patient ${pat.name} unchanged`);
    }
    saved.push(existing);
  }
  return saved;
}

async function seedQueueEntries(
  dataSource: DataSource,
  patients: Patient[],
  allowReset: boolean,
) {
  const repo = dataSource.getRepository(QueueEntry);
  const queueEntries = [
    {
      patientId: patients[0].id,
      queueNumber: 1,
      status: "waiting",
      priority: "normal",
      arrivalTime: new Date(Date.now() - 30 * 60 * 1000),
      estimatedWaitTime: 15,
    },
    {
      patientId: patients[1].id,
      queueNumber: 2,
      status: "with_doctor",
      priority: "urgent",
      arrivalTime: new Date(Date.now() - 45 * 60 * 1000),
      estimatedWaitTime: 0,
    },
    {
      patientId: patients[2].id,
      queueNumber: 3,
      status: "waiting",
      priority: "normal",
      arrivalTime: new Date(Date.now() - 15 * 60 * 1000),
      estimatedWaitTime: 25,
    },
    {
      patientId: patients[3].id,
      queueNumber: 4,
      status: "waiting",
      priority: "urgent",
      arrivalTime: new Date(Date.now() - 10 * 60 * 1000),
      estimatedWaitTime: 5,
    },
  ];
  const count = await repo.count();
  if (allowReset || count === 0) {
    if (count === 0 && !allowReset)
      console.log("ℹ️ Queue empty – seeding initial sample entries.");
    await repo.save(queueEntries.map((q) => repo.create(q)));
  } else {
    console.log("ℹ️ Existing queue entries present – skipping.");
  }
}

async function seedAppointments(
  dataSource: DataSource,
  patients: Patient[],
  doctors: Doctor[],
  allowReset: boolean,
) {
  const repo = dataSource.getRepository(Appointment);
  const now = new Date();
  const appointments = [
    {
      patientId: patients[4].id,
      doctorId: doctors[0].id,
      appointmentDatetime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      status: "booked",
      notes: "Regular checkup",
    },
    {
      patientId: patients[5].id,
      doctorId: doctors[1].id,
      appointmentDatetime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      status: "booked",
      notes: "Cardiology consultation",
    },
    {
      patientId: patients[6].id,
      doctorId: doctors[2].id,
      appointmentDatetime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      status: "booked",
      notes: "Pediatric examination",
    },
    {
      patientId: patients[7].id,
      doctorId: doctors[0].id,
      appointmentDatetime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      status: "completed",
      notes: "Follow-up visit completed",
    },
    {
      patientId: patients[0].id,
      doctorId: doctors[3].id,
      appointmentDatetime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      status: "canceled",
      notes: "Patient requested cancellation",
    },
  ];
  const count = await repo.count();
  if (allowReset || count === 0) {
    if (count === 0 && !allowReset)
      console.log(
        "ℹ️ Appointments empty – seeding initial sample appointments.",
      );
    await repo.save(appointments.map((a) => repo.create(a)));
  } else {
    console.log("ℹ️ Existing appointments present – skipping.");
  }
}

export async function seedDatabase(dataSource: DataSource) {
  const allowReset = process.env.ALLOW_DB_RESET === "true";
  const lockPath = path.resolve(process.cwd(), "SEED_LOCK");
  const ignoreLock = process.env.IGNORE_SEED_LOCK === "true";
  if (fs.existsSync(lockPath) && !allowReset && !ignoreLock) {
    console.log(
      "🔒 SEED_LOCK present – performing top-up check for missing core sample data.",
    );
    // Top-up logic: if appointments or queue entries are completely empty we seed JUST those samples non-destructively.
    try {
      // We need a lightweight data source for inspection
      const ds = dataSource; // reuse inbound dataSource (already configured outside)
      const appointmentRepo = ds.getRepository(Appointment);
      const queueRepo = ds.getRepository(QueueEntry);
      const doctorRepo = ds.getRepository(Doctor);
      const patientRepo = ds.getRepository(Patient);
      const [apptCount, queueCount] = await Promise.all([
        appointmentRepo.count(),
        queueRepo.count(),
      ]);
      if (apptCount === 0 || queueCount === 0) {
        const doctors = await doctorRepo.find();
        const patients = await patientRepo.find();
        if (doctors.length === 0 || patients.length === 0) {
          console.log(
            "⚠️ Cannot top-up sample data: doctors or patients missing. Run full seed after removing SEED_LOCK.",
          );
          return;
        }
        if (queueCount === 0) {
          console.log(
            "➕ Seeding missing queue sample entries (lock respected).",
          );
          await seedQueueEntries(ds, patients, false);
        }
        if (apptCount === 0) {
          console.log(
            "➕ Seeding missing appointment sample entries (lock respected).",
          );
          await seedAppointments(ds, patients, doctors, false);
        }
        console.log("✅ Top-up complete.");
      } else {
        console.log("ℹ️ Core sample data already present – nothing to do.");
      }
    } catch (e) {
      console.log("⚠️ Top-up attempt failed:", (e as Error).message);
    }
    return; // Always return; we are not doing full seed while locked
  }

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    if (allowReset) {
      console.log("🔧 Disabling foreign key checks (reset mode)...");
      await queryRunner.query("SET FOREIGN_KEY_CHECKS = 0;");
      for (const table of [
        "appointments",
        "queue_entries",
        "patients",
        "doctors",
        "users",
      ]) {
        await queryRunner.query(`TRUNCATE TABLE ${table}`);
      }
      console.log("🧹 Cleared all tables due to ALLOW_DB_RESET=true.");
    } else {
      console.log(
        "ℹ️ ALLOW_DB_RESET not set - performing idempotent seed (no destructive truncate).",
      );
    }

    await seedUsers(dataSource);
    const doctors = await seedDoctors(dataSource);
    const patients = await seedPatients(dataSource);
    await seedQueueEntries(dataSource, patients, allowReset);
    await seedAppointments(dataSource, patients, doctors, allowReset);

    await queryRunner.commitTransaction();
    console.log("\n✅ Database seeded successfully!");
    console.log("🔐 Login credentials:");
    console.log(
      "   Admin - Username: admin, Password:",
      process.env.SEED_ADMIN_PASSWORD || "Admin123",
    );
    console.log(
      "   Staff - Username: staff, Password:",
      process.env.SEED_STAFF_PASSWORD || "Staff123",
    );
    try {
      if (allowReset || !fs.existsSync(lockPath)) {
        fs.writeFileSync(
          lockPath,
          `Seed lock created ${new Date().toISOString()}\nallowResetDuringThisRun=${allowReset}\n`,
          { encoding: "utf8" },
        );
        console.log(
          `🔏 SEED_LOCK ${allowReset ? "refreshed" : "created"} at ${lockPath}`,
        );
      } else if (ignoreLock) {
        console.log(
          "⚠️ IGNORE_SEED_LOCK used – retaining existing SEED_LOCK file.",
        );
      }
    } catch (lockErr) {
      console.warn("⚠️ Could not write SEED_LOCK file:", lockErr);
    }
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
