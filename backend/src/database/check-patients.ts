import "dotenv/config";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { User, Doctor, Patient, QueueEntry, Appointment } from "../entities";
import { resolveDatabaseName } from "./db-config";

async function main() {
  const cfg = new ConfigService();
  const dbName = resolveDatabaseName(process.env);
  const ds = new DataSource({
    type: "mysql",
    host: cfg.get("DB_HOST", "localhost"),
    port: cfg.get("DB_PORT", 3306),
    username: cfg.get("DB_USERNAME", "root"),
    password: process.env.DB_PASSWORD,
    database: dbName,
    entities: [User, Doctor, Patient, QueueEntry, Appointment],
    synchronize: false,
    logging: false,
  });
  try {
    await ds.initialize();
    const patientCount = await ds.getRepository(Patient).count();
    const appointmentCount = await ds.getRepository(Appointment).count();
    const doctorCount = await ds.getRepository(Doctor).count();
    const queueCount = await ds.getRepository(QueueEntry).count();
    console.log(
      `Counts (db=${dbName}) => patients: ${patientCount}, doctors: ${doctorCount}, appointments: ${appointmentCount}, queue_entries: ${queueCount}`,
    );
    if (patientCount === 0) console.log("No patients found. Run: npm run seed");
    if (appointmentCount === 0)
      console.log(
        "No appointments found (first-run seed seeds them if table empty).",
      );
  } catch (e) {
    const err = e as Error;
    console.error("DB check failed:", err.message);
  } finally {
    await ds.destroy();
  }
}
// Execute with explicit error surface
main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled error in DB check:", (e as Error).message);
});
