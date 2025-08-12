import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, Doctor, Patient, QueueEntry, Appointment } from './src/entities';
import { resolveDatabaseName } from './src/database/db-config';

const configService = new ConfigService();

const isTest = configService.get('NODE_ENV') === 'test';
const databaseName = resolveDatabaseName(process.env);
if (process.env.NODE_ENV === 'production' && databaseName !== 'front_desk_system') {
  throw new Error(`Refusing to initialize DataSource: production requires DB_NAME=front_desk_system (got ${databaseName})`);
}
export default new DataSource({
  type: 'mysql',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 3306),
  username: configService.get('DB_USERNAME', 'root'),
  password: configService.get('DB_PASSWORD', ''),
  database: databaseName,
  entities: [User, Doctor, Patient, QueueEntry, Appointment],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: isTest,
  dropSchema: isTest,
  logging: configService.get('NODE_ENV') === 'development',
});