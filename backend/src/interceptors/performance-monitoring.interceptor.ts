import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';

@Injectable()
export class PerformanceMonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceMonitoringInterceptor.name);

  constructor(private readonly cacheService: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('User-Agent') || '';
    const ip = request.ip || request.connection.remoteAddress;

    return next.handle().pipe(
      tap({
        next: (data) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = response.statusCode;

          // Log performance metrics
          this.logPerformanceMetrics({
            method,
            url,
            statusCode,
            duration,
            userAgent,
            ip,
            dataSize: this.calculateDataSize(data),
          });

          // Store metrics for monitoring
          this.storeMetrics({
            method,
            url,
            statusCode,
            duration,
            timestamp: new Date(),
          });

          // Alert on slow requests
          if (duration > 2000) {
            this.logger.warn(
              `Slow request detected: ${method} ${url} took ${duration}ms`
            );
          }
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = response.statusCode || 500;

          this.logger.error(
            `Request failed: ${method} ${url} - ${error.message} (${duration}ms)`
          );

          this.storeMetrics({
            method,
            url,
            statusCode,
            duration,
            timestamp: new Date(),
            error: error.message,
          });
        },
      })
    );
  }

  private logPerformanceMetrics(metrics: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    userAgent: string;
    ip: string;
    dataSize: number;
  }) {
    const { method, url, statusCode, duration, dataSize } = metrics;
    
    // Log different levels based on performance
    if (duration > 5000) {
      this.logger.error(
        `CRITICAL: ${method} ${url} - ${statusCode} - ${duration}ms - ${dataSize}B`
      );
    } else if (duration > 2000) {
      this.logger.warn(
        `SLOW: ${method} ${url} - ${statusCode} - ${duration}ms - ${dataSize}B`
      );
    } else if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `${method} ${url} - ${statusCode} - ${duration}ms - ${dataSize}B`
      );
    }
  }

  private storeMetrics(metrics: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    timestamp: Date;
    error?: string;
  }) {
    const key = `metrics:${Date.now()}:${Math.random()}`;
    
    // Store metrics in cache for monitoring dashboard
    this.cacheService.set(key, metrics, 3600); // 1 hour TTL

    // Also store aggregated metrics
    this.updateAggregatedMetrics(metrics);
  }

  private updateAggregatedMetrics(metrics: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    timestamp: Date;
    error?: string;
  }) {
    const { method, url, statusCode, duration } = metrics;
    const endpoint = `${method}:${url}`;
    const hour = new Date().getHours();
    const aggregateKey = `aggregate:${endpoint}:${hour}`;

    // Get existing aggregate or create new one
    const existing = this.cacheService.get<{
      count: number;
      totalDuration: number;
      avgDuration: number;
      minDuration: number;
      maxDuration: number;
      errorCount: number;
      statusCodes: Record<number, number>;
    }>(aggregateKey) || {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      errorCount: 0,
      statusCodes: {},
    };

    // Update aggregate metrics
    existing.count += 1;
    existing.totalDuration += duration;
    existing.avgDuration = existing.totalDuration / existing.count;
    existing.minDuration = Math.min(existing.minDuration, duration);
    existing.maxDuration = Math.max(existing.maxDuration, duration);
    
    if (statusCode >= 400) {
      existing.errorCount += 1;
    }
    
    existing.statusCodes[statusCode] = (existing.statusCodes[statusCode] || 0) + 1;

    // Store updated aggregate
    this.cacheService.set(aggregateKey, existing, 3600);
  }

  private calculateDataSize(data: any): number {
    if (!data) return 0;
    
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}

// Decorator for method-level performance monitoring
export function MonitorPerformance(threshold: number = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const className = target.constructor.name;
      const methodName = propertyName;

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;

        if (duration > threshold) {
          Logger.warn(
            `Slow method: ${className}.${methodName} took ${duration}ms`,
            'PerformanceMonitor'
          );
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        Logger.error(
          `Method failed: ${className}.${methodName} failed after ${duration}ms - ${error.message}`,
          error.stack,
          'PerformanceMonitor'
        );
        throw error;
      }
    };
  };
}