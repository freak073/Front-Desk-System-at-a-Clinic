import "dotenv/config";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { seedDatabase } from "./seeds/initial-seed";
import { resolveDatabaseName } from "./db-config";
import { User, Doctor, Patient, QueueEntry, Appointment } from "../entities";

async function runSeed() {
  const configService = new ConfigService();

  const dbName = resolveDatabaseName(process.env);
  const dataSource = new DataSource({
    type: "mysql",
    host: configService.get("DB_HOST", "localhost"),
    port: configService.get("DB_PORT", 3306),
    username: configService.get("DB_USERNAME", "root"),
    password: process.env.DB_PASSWORD,
    database: dbName,
    entities: [User, Doctor, Patient, QueueEntry, Appointment],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log(
      `✅ Database connection established (db=${dbName}, env=${process.env.NODE_ENV || "unknown"})`,
    );

    await seedDatabase(dataSource);

    console.log("🎉 Seeding completed successfully");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
  } finally {
    await dataSource.destroy();
    console.log("🔌 Database connection closed");
  }
}

void runSeed();
