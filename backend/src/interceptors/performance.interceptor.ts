/**
 * Performance interceptors for optimizing API responses
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, map } from "rxjs/operators";

/**
 * Interceptor for measuring and logging API response times
 */
@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  private readonly logger = new Logger("ResponseTimeInterceptor");

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Add response time header
        const response = context.switchToHttp().getResponse();
        response.header("X-Response-Time", `${responseTime}ms`);

        // Log response time for slow requests
        if (responseTime > 500) {
          this.logger.warn(
            `Slow response: ${method} ${url} - ${responseTime}ms`,
          );
        } else if (process.env.NODE_ENV === "development") {
          this.logger.debug(`${method} ${url} - ${responseTime}ms`);
        }
      }),
    );
  }
}

/**
 * Interceptor for optimizing response payload size
 */
@Injectable()
export class ResponseOptimizationInterceptor implements NestInterceptor {
  private readonly logger = new Logger("ResponseOptimizationInterceptor");

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        // Check if client requested field filtering
        const fields = this.getRequestedFields(request);
        if (fields.length > 0) {
          return this.filterFields(data, fields);
        }

        return data;
      }),
    );
  }

  /**
   * Get requested fields from query parameter
   * @param request - HTTP request
   * @returns Array of requested fields
   */
  private getRequestedFields(request: any): string[] {
    const fieldsParam = request.query.fields;
    if (!fieldsParam) {
      return [];
    }

    return fieldsParam.split(",").map((field) => field.trim());
  }

  /**
   * Filter response data to include only requested fields
   * @param data - Response data
   * @param fields - Requested fields
   * @returns Filtered data
   */
  private filterFields(data: any, fields: string[]): any {
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.filterFields(item, fields));
    }

    // Handle objects
    if (data && typeof data === "object") {
      const result: any = {};

      // Include only requested fields
      fields.forEach((field) => {
        if (field in data) {
          result[field] = data[field];
        }
      });

      return result;
    }

    // Return primitive values as is
    return data;
  }
}

/**
 * Interceptor for adding pagination metadata to responses
 */
@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const request = context.switchToHttp().getRequest();

        // Check if response is paginated
        if (
          data &&
          typeof data === "object" &&
          "items" in data &&
          "total" in data
        ) {
          // Extract pagination parameters from request
          const page = parseInt(request.query.page, 10) || 1;
          const limit = parseInt(request.query.limit, 10) || 10;

          // Add pagination metadata
          return {
            items: data.items,
            meta: {
              total: data.total,
              page,
              limit,
              pages: Math.ceil(data.total / limit),
              hasNextPage: page * limit < data.total,
              hasPreviousPage: page > 1,
            },
          };
        }

        return data;
      }),
    );
  }
}

/**
 * Interceptor for handling data transformation and serialization
 */
@Injectable()
export class DataTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Skip transformation for non-object responses
        if (!data || typeof data !== "object") {
          return data;
        }

        // Transform response data
        return this.transformData(data);
      }),
    );
  }

  /**
   * Transform response data
   * @param data - Response data
   * @returns Transformed data
   */
  private transformData(data: any): any {
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.transformData(item));
    }

    // Handle objects
    if (data && typeof data === "object") {
      const result: any = {};

      // Transform each property
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // Skip null and undefined values
          if (data[key] === null || data[key] === undefined) {
            continue;
          }

          // Transform nested objects and arrays
          if (typeof data[key] === "object") {
            result[key] = this.transformData(data[key]);
          } else {
            result[key] = data[key];
          }
        }
      }

      return result;
    }

    return data;
  }
}

/**
 * Example usage in app.module.ts:
 *
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: ResponseTimeInterceptor,
 *     },
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: ResponseOptimizationInterceptor,
 *     },
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: PaginationInterceptor,
 *     },
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: DataTransformInterceptor,
 *     },
 *   ],
 * })
 * export class AppModule {}
 */
