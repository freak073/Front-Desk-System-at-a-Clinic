import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { QueueModule } from './queue/queue.module';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_NAME', 'front_desk_system'),
        entities: [__dirname + '/entities/*.entity{.ts,.js}'],
        synchronize: false, // Disabled since we have manual schema setup
        logging: configService.get('NODE_ENV') === 'development',
        extra: {
          connectionLimit: 10,
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    DoctorsModule,
    PatientsModule,
    QueueModule,
    AppointmentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}