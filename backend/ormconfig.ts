import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, Doctor, Patient, QueueEntry, Appointment } from './src/entities';

const configService = new ConfigService();

const isTest = configService.get('NODE_ENV') === 'test';
export default new DataSource({
  type: 'mysql',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 3306),
  username: configService.get('DB_USERNAME', 'root'),
  password: configService.get('DB_PASSWORD', ''),
  database: isTest ? 'clinic_test' : configService.get('DB_NAME', 'front_desk_system'),
  entities: [User, Doctor, Patient, QueueEntry, Appointment],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: isTest,
  dropSchema: isTest,
  logging: configService.get('NODE_ENV') === 'development',
});