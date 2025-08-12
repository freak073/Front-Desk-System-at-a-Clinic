/**
 * Controller for monitoring and health checks
 */

import { Controller, Get, UseGuards, Query } from "@nestjs/common";
import { ApiResponseDto } from "../common/dto/api-response.dto";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  ErrorMonitoringService,
  ErrorSeverity,
} from "../services/error-monitoring.service";
import { CacheService } from "../services/cache.service";
import { DataSource } from "typeorm";

/**
 * Controller for monitoring and health checks
 */
@ApiTags("Monitoring")
@Controller("monitoring")
export class MonitoringController {
  constructor(
    private readonly errorMonitoringService: ErrorMonitoringService,
    private readonly cacheService: CacheService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get system health status
   */
  @Get("health")
  @ApiOperation({ summary: "Get system health status" })
  @ApiResponse({ status: 200, description: "System health information" })
  getHealth(): ApiResponseDto<unknown> {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    return ApiResponseDto.success({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + " MB",
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + " MB",
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + " MB",
        external: Math.round(memoryUsage.external / 1024 / 1024) + " MB",
      },
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV || "development",
    });
  }

  /**
   * Readiness probe (light DB connectivity check)
   */
  @Get("ready")
  @ApiOperation({ summary: "Readiness probe" })
  @ApiResponse({ status: 200, description: "Service ready" })
  @ApiResponse({ status: 500, description: "Not ready" })
  async getReady(): Promise<
    ApiResponseDto<{
      status: string;
      timestamp: string;
      tables?: Record<string, number>;
    }>
  > {
    // Lightweight connectivity & minimal table counts (non-blocking if a table missing)
    await this.dataSource.query("SELECT 1");
    const criticalTables = ["users", "doctors", "patients", "appointments"];
    const tables: Record<string, number> = {};
    for (const t of criticalTables) {
      try {
        const result = await this.dataSource.query(
          `SELECT COUNT(*) as c FROM ${t}`,
        );
        const row: Record<string, unknown> = result[0] || {};
        const values = Object.values(row);
        const firstVal = values.length > 0 ? values[0] : 0;
        const raw = row.c ?? firstVal;
        const num = typeof raw === "number" ? raw : Number(raw);
        tables[t] = Number.isFinite(num) ? num : 0;
      } catch {
        tables[t] = -1; // sentinel when table inaccessible
      }
    }
    return ApiResponseDto.success({
      status: "ready",
      timestamp: new Date().toISOString(),
      tables,
    });
  }

  /**
   * Get error statistics (admin only)
   */
  @Get("errors")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Get error statistics (admin only)" })
  @ApiResponse({ status: 200, description: "Error statistics" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  getErrorStats(): ApiResponseDto<unknown> {
    return ApiResponseDto.success(this.errorMonitoringService.getErrorStats());
  }

  /**
   * Get recent errors (admin only)
   */
  @Get("errors/recent")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Get recent errors (admin only)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "severity", required: false, enum: ErrorSeverity })
  @ApiResponse({ status: 200, description: "Recent errors" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  getRecentErrors(
    @Query("limit") limit?: number,
    @Query("severity") severity?: ErrorSeverity,
  ): ApiResponseDto<unknown> {
    if (severity) {
      return ApiResponseDto.success(
        this.errorMonitoringService.getErrorsBySeverity(severity, limit || 10),
      );
    }
    return ApiResponseDto.success(
      this.errorMonitoringService.getRecentErrors(limit || 10),
    );
  }

  /**
   * Get cache statistics (admin only)
   */
  @Get("cache")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Get cache statistics (admin only)" })
  @ApiResponse({ status: 200, description: "Cache statistics" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  getCacheStats(): ApiResponseDto<unknown> {
    return ApiResponseDto.success(this.cacheService.getStats());
  }

  /**
   * Test error handling (admin only)
   */
  @Get("test-error")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Test error handling (admin only)" })
  @ApiResponse({ status: 500, description: "Test error" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  testError() {
    throw new Error("Test error from monitoring controller");
  }
}
