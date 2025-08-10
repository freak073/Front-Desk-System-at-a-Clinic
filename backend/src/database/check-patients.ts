import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, Doctor, Patient, QueueEntry, Appointment } from '../entities';

async function main() {
  const cfg = new ConfigService();
  const ds = new DataSource({
    type: 'mysql',
    host: cfg.get('DB_HOST', 'localhost'),
    port: cfg.get('DB_PORT', 3306),
    username: cfg.get('DB_USERNAME', 'root'),
    password: process.env.DB_PASSWORD,
    database: cfg.get('DB_NAME', 'front_desk_system'),
    entities: [User, Doctor, Patient, QueueEntry, Appointment],
    synchronize: false,
    logging: false,
  });
  try {
    await ds.initialize();
    const count = await ds.getRepository(Patient).count();
    console.log(`Patients table row count: ${count}`);
    if (count === 0) {
      console.log('No patients found. Run: npm run seed');
    }
  } catch (e) {
    console.error('DB check failed:', e.message);
  } finally {
    await ds.destroy();
  }
}
main();
