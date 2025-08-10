/**
 * Module for monitoring and health checks
 */

import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { ErrorMonitoringService } from '../services/error-monitoring.service';
import { CacheService } from '../services/cache.service';

/**
 * Module for monitoring and health checks
 */
@Module({
  controllers: [MonitoringController],
  providers: [ErrorMonitoringService, CacheService],
  exports: [ErrorMonitoringService, CacheService],
})
export class MonitoringModule {}