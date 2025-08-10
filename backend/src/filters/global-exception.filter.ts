/**
 * Global exception filter for handling all application exceptions
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorMonitoringService, ErrorSeverity } from '../services/error-monitoring.service';

/**
 * Error response interface
 */
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
  correlationId?: string;
}

/**
 * Global exception filter that catches all exceptions
 * and formats them into a consistent response format
 */
@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  constructor(private errorMonitoringService: ErrorMonitoringService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate a correlation ID for tracking this error
    const correlationId = this.generateCorrelationId();

    // Determine HTTP status code
    const status = this.getHttpStatus(exception);

    // Get error message
    const message = this.getErrorMessage(exception);

    // Determine error severity based on status code
    const severity = this.getErrorSeverity(status);

    // Capture error for monitoring
    this.captureError(exception, severity, request, correlationId);

    // Log the error
    this.logError(exception, request, correlationId, status);

    // Send error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: this.getErrorName(exception),
      path: request.url,
      timestamp: new Date().toISOString(),
      correlationId,
    };

    // In production, remove stack traces and sensitive information
    if (process.env.NODE_ENV === 'production') {
      delete (errorResponse as any).stack;
    } else {
      // Add stack trace for development
      (errorResponse as any).stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Get HTTP status code from exception
   * @param exception - Exception object
   * @returns HTTP status code
   */
  private getHttpStatus(exception: any): number {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Get error message from exception
   * @param exception - Exception object
   * @returns Error message
   */
  private getErrorMessage(exception: any): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return typeof response === 'object' && 'message' in response
        ? Array.isArray(response.message)
          ? response.message.join(', ')
          : String(response.message)
        : exception.message;
    }
    return exception.message || 'Internal server error';
  }

  /**
   * Get error name from exception
   * @param exception - Exception object
   * @returns Error name
   */
  private getErrorName(exception: any): string {
    if (exception instanceof HttpException) {
      return HttpStatus[exception.getStatus()] || 'HttpException';
    }
    return exception.name || 'InternalServerError';
  }

  /**
   * Get error severity based on status code
   * @param status - HTTP status code
   * @returns Error severity
   */
  private getErrorSeverity(status: number): ErrorSeverity {
    if (status >= 500) {
      return ErrorSeverity.HIGH;
    } else if (status >= 400) {
      return ErrorSeverity.MEDIUM;
    }
    return ErrorSeverity.LOW;
  }

  /**
   * Capture error for monitoring
   * @param exception - Exception object
   * @param severity - Error severity
   * @param request - HTTP request
   * @param correlationId - Correlation ID
   */
  private captureError(
    exception: any,
    severity: ErrorSeverity,
    request: Request,
    correlationId: string,
  ): void {
    // Create error context with request information
    const context = {
      path: request.url,
      method: request.method,
      query: request.query,
      // Avoid logging sensitive information
      body: this.sanitizeRequestBody(request.body),
      userId: (request as any).user?.id,
      metadata: {
        correlationId,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      },
    };

    // Capture error with context
    this.errorMonitoringService.captureError(exception, severity, context);
  }

  /**
   * Log error details
   * @param exception - Exception object
   * @param request - HTTP request
   * @param correlationId - Correlation ID
   * @param status - HTTP status code
   */
  private logError(
    exception: any,
    request: Request,
    correlationId: string,
    status: number,
  ): void {
    const message = `${request.method} ${request.url} - ${status} - ${correlationId}`;

    if (status >= 500) {
      this.logger.error(
        `${message} - ${exception.message}`,
        exception.stack,
      );
    } else if (status >= 400) {
      this.logger.warn(`${message} - ${exception.message}`);
    } else {
      this.logger.log(`${message} - ${exception.message}`);
    }
  }

  /**
   * Generate a correlation ID for tracking errors
   * @returns Correlation ID
   */
  private generateCorrelationId(): string {
    return `err-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Sanitize request body to remove sensitive information
   * @param body - Request body
   * @returns Sanitized body
   */
  private sanitizeRequestBody(body: any): any {
    if (!body) {
      return {};
    }

    // Create a copy of the body
    const sanitized = { ...body };

    // List of sensitive fields to redact
    const sensitiveFields = [
      'password',
      'passwordConfirmation',
      'currentPassword',
      'newPassword',
      'token',
      'accessToken',
      'refreshToken',
      'credit_card',
      'creditCard',
      'ssn',
      'socialSecurityNumber',
    ];

    // Redact sensitive fields
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}