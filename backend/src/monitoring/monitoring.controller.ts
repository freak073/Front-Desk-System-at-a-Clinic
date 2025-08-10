/**
 * Controller for monitoring and health checks
 */

import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorMonitoringService, ErrorSeverity } from '../services/error-monitoring.service';
import { CacheService } from '../services/cache.service';

/**
 * Controller for monitoring and health checks
 */
@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly errorMonitoringService: ErrorMonitoringService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Get system health status
   */
  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health information' })
  getHealth() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
      },
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Get error statistics (admin only)
   */
  @Get('errors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get error statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Error statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getErrorStats() {
    return this.errorMonitoringService.getErrorStats();
  }

  /**
   * Get recent errors (admin only)
   */
  @Get('errors/recent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get recent errors (admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'severity', required: false, enum: ErrorSeverity })
  @ApiResponse({ status: 200, description: 'Recent errors' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getRecentErrors(
    @Query('limit') limit?: number,
    @Query('severity') severity?: ErrorSeverity,
  ) {
    if (severity) {
      return this.errorMonitoringService.getErrorsBySeverity(severity, limit || 10);
    }
    return this.errorMonitoringService.getRecentErrors(limit || 10);
  }

  /**
   * Get cache statistics (admin only)
   */
  @Get('cache')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get cache statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Cache statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getCacheStats() {
    return this.cacheService.getStats();
  }

  /**
   * Test error handling (admin only)
   */
  @Get('test-error')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Test error handling (admin only)' })
  @ApiResponse({ status: 500, description: 'Test error' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  testError() {
    throw new Error('Test error from monitoring controller');
  }
}