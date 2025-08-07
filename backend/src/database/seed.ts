import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { seedDatabase } from './seeds/initial-seed';
import { User, Doctor, Patient, QueueEntry, Appointment } from '../entities';

async function runSeed() {
  const configService = new ConfigService();
  
  const dataSource = new DataSource({
    type: 'mysql',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 3306),
    username: configService.get('DB_USERNAME', 'root'),
    password: configService.get('DB_PASSWORD', ''),
    database: configService.get('DB_NAME', 'front_desk_system'),
    entities: [User, Doctor, Patient, QueueEntry, Appointment],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');
    
    await seedDatabase(dataSource);
    
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await dataSource.destroy();
  }
}

runSeed();