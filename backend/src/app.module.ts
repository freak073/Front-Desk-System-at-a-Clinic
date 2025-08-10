import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { QueueModule } from './queue/queue.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { 
  PerformanceMiddleware, 
  ResponseCacheMiddleware, 
  QueryOptimizationMiddleware 
} from './middleware/performance.middleware';
import {
  ResponseTimeInterceptor,
  ResponseOptimizationInterceptor,
  PaginationInterceptor,
  DataTransformInterceptor
} from './interceptors/performance.interceptor';
import { CacheService } from './services/cache.service';
import { QueryOptimizationService } from './services/query-optimization.service';
import { ErrorMonitoringService } from './services/error-monitoring.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
        limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
      },
    ]),
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
    DashboardModule,
    MonitoringModule,
  ],
  controllers: [AppController],
  providers: [
    PerformanceMiddleware,
    ResponseCacheMiddleware,
    QueryOptimizationMiddleware,
    CacheService,
    QueryOptimizationService,
    ErrorMonitoringService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseOptimizationInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PaginationInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DataTransformInterceptor,
    }
    ,
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PerformanceMiddleware, ResponseCacheMiddleware, QueryOptimizationMiddleware)
      .forRoutes('*');
  }
}