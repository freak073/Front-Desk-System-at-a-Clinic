/**
 * Performance middleware for optimizing API responses and tracking performance metrics
 */

import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

/**
 * Configuration for performance middleware
 */
export const PERFORMANCE_CONFIG = {
  // Enable performance tracking
  ENABLED: true,
  // Log slow requests (in milliseconds)
  SLOW_REQUEST_THRESHOLD: 500,
  // Log very slow requests (in milliseconds)
  VERY_SLOW_REQUEST_THRESHOLD: 2000,
  // Enable detailed logging for slow requests
  DETAILED_LOGGING: true,
  // Enable response compression
  ENABLE_COMPRESSION: true,
  // Enable response caching
  ENABLE_CACHING: true,
  // Default cache time in seconds
  DEFAULT_CACHE_TIME: 60,
};

/**
 * Performance middleware for tracking API request performance
 */
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger("PerformanceMiddleware");

  use(req: Request, res: Response, next: NextFunction) {
    // Skip if performance tracking is disabled
    if (!PERFORMANCE_CONFIG.ENABLED) {
      return next();
    }

    // Record start time
    const startTime = process.hrtime();

    // Add request ID for tracking
    const requestId = this.generateRequestId();
    req["requestId"] = requestId;

    // Log request start in development
    if (process.env.NODE_ENV === "development") {
      this.logger.debug(
        `[${requestId}] ${req.method} ${req.originalUrl} - Started`,
      );
    }

    // Track response time
    res.on("finish", () => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTimeMs = seconds * 1000 + nanoseconds / 1000000;

      // Add response time header safely (if not already sent)
      if (!res.headersSent) {
        res.setHeader("X-Response-Time", `${responseTimeMs.toFixed(2)}ms`);
      }

      // Log slow requests
      if (responseTimeMs > PERFORMANCE_CONFIG.VERY_SLOW_REQUEST_THRESHOLD) {
        this.logger.warn(
          `[${requestId}] ${req.method} ${req.originalUrl} - Very slow request: ${responseTimeMs.toFixed(2)}ms`,
        );

        if (PERFORMANCE_CONFIG.DETAILED_LOGGING) {
          this.logRequestDetails(req);
        }
      } else if (responseTimeMs > PERFORMANCE_CONFIG.SLOW_REQUEST_THRESHOLD) {
        this.logger.warn(
          `[${requestId}] ${req.method} ${req.originalUrl} - Slow request: ${responseTimeMs.toFixed(2)}ms`,
        );
      } else if (process.env.NODE_ENV === "development") {
        this.logger.debug(
          `[${requestId}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTimeMs.toFixed(2)}ms`,
        );
      }
    });

    // Continue to next middleware
    next();
  }

  /**
   * Generate a unique request ID
   * @returns Unique request ID
   */
  private generateRequestId(): string {
    try {
      return randomUUID();
    } catch {
      return `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }
  }

  /**
   * Log detailed request information for debugging slow requests
   * @param req - Express request object
   */
  private logRequestDetails(req: Request): void {
    this.logger.debug("Request details:");
    this.logger.debug(`URL: ${req.originalUrl}`);
    this.logger.debug(`Method: ${req.method}`);
    this.logger.debug(`Headers: ${JSON.stringify(req.headers)}`);
    this.logger.debug(`Query: ${JSON.stringify(req.query)}`);
    this.logger.debug(`Body: ${JSON.stringify(req.body)}`);
  }
}

/**
 * Middleware for response caching
 */
@Injectable()
export class ResponseCacheMiddleware implements NestMiddleware {
  private readonly logger = new Logger("ResponseCacheMiddleware");
  private readonly cache = new Map<string, { data: any; expiry: number }>();

  use(req: Request, res: Response, next: NextFunction) {
    // Skip if caching is disabled
    if (!PERFORMANCE_CONFIG.ENABLE_CACHING) {
      return next();
    }

    // Skip caching for non-GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Skip caching for any request carrying Authorization header (avoid leaking protected data)
    if (req.headers.authorization) {
      return next();
    }

    // Generate cache key from URL and query parameters
    const cacheKey = this.generateCacheKey(req);

    // Check if we have a cached response
    const cachedResponse = this.cache.get(cacheKey);
    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      // Add cache header
      res.setHeader("X-Cache", "HIT");

      // Send cached response
      return res.json(cachedResponse.data);
    }

    // Add cache header
    res.setHeader("X-Cache", "MISS");

    // Store original res.json method
    const originalJson = res.json;

    // Override res.json method to cache the response
    res.json = (data: any): Response => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Get cache time from header or use default
        const cacheTime = this.getCacheTime(req, res);

        // Store in cache if cache time is greater than 0
        if (cacheTime > 0) {
          this.cache.set(cacheKey, {
            data,
            expiry: Date.now() + cacheTime * 1000,
          });

          if (process.env.NODE_ENV === "development") {
            this.logger.debug(
              `Cached response for ${req.method} ${req.originalUrl} for ${cacheTime} seconds`,
            );
          }
        }
      }

      // Call original json method
      return originalJson.call(res, data);
    };

    next();
  }

  /**
   * Generate a cache key from request
   * @param req - Express request object
   * @returns Cache key
   */
  private generateCacheKey(req: Request): string {
    const authMarker = req.headers.authorization ? "auth" : "anon";
    return `${req.method}:${authMarker}:${req.originalUrl}:${JSON.stringify(req.query)}`;
  }

  /**
   * Get cache time from request/response or use default
   * @param req - Express request object
   * @param res - Express response object
   * @returns Cache time in seconds
   */
  private getCacheTime(req: Request, res: Response): number {
    // Check for cache-control header in response
    const cacheControl = res.getHeader("Cache-Control");
    if (cacheControl && typeof cacheControl === "string") {
      const regex = /max-age=(\d+)/;
      const execResult = regex.exec(cacheControl);
      const val = execResult?.[1];
      if (val) return parseInt(val, 10);
    }

    // Check for x-cache-time header in request
    const xCacheTime = req.headers["x-cache-time"];
    if (xCacheTime && typeof xCacheTime === "string") {
      const cacheTime = parseInt(xCacheTime, 10);
      if (!isNaN(cacheTime)) {
        return cacheTime;
      }
    }

    // Use default cache time
    return PERFORMANCE_CONFIG.DEFAULT_CACHE_TIME;
  }

  /**
   * Clear the entire response cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log("Response cache cleared");
  }

  /**
   * Clear cache entries matching a pattern
   * @param pattern - Pattern to match cache keys
   */
  clearCachePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.logger.log(
      `Cleared ${count} cache entries matching pattern: ${pattern}`,
    );
  }
}

/**
 * Middleware for query optimization
 */
@Injectable()
export class QueryOptimizationMiddleware implements NestMiddleware {
  private readonly logger = new Logger("QueryOptimizationMiddleware");

  use(req: Request, res: Response, next: NextFunction) {
    // Add query optimization utilities to request object
    req["optimizeQuery"] = {
      // Parse pagination parameters from request
      getPaginationParams: () => this.getPaginationParams(req),
      // Parse sorting parameters from request
      getSortingParams: () => this.getSortingParams(req),
      // Parse field selection parameters from request
      getFieldSelectionParams: () => this.getFieldSelectionParams(req),
    };

    next();
  }

  /**
   * Parse pagination parameters from request
   * @param req - Express request object
   * @returns Pagination parameters
   */
  private getPaginationParams(req: Request): {
    page: number;
    limit: number;
    offset: number;
  } {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Parse sorting parameters from request
   * @param req - Express request object
   * @returns Sorting parameters
   */
  private getSortingParams(req: Request): {
    sortBy: string;
    sortOrder: "ASC" | "DESC";
  } {
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder: "ASC" | "DESC" =
      (req.query.sortOrder as string)?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    return { sortBy, sortOrder };
  }

  /**
   * Parse field selection parameters from request
   * @param req - Express request object
   * @returns Selected fields
   */
  private getFieldSelectionParams(req: Request): string[] {
    const fields = req.query.fields as string;
    if (!fields) {
      return [];
    }

    return fields.split(",").map((field) => field.trim());
  }
}

/**
 * Example usage in app.module.ts:
 *
 * @Module({
 *   imports: [...],
 *   controllers: [...],
 *   providers: [...],
 * })
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(PerformanceMiddleware, ResponseCacheMiddleware, QueryOptimizationMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 */
