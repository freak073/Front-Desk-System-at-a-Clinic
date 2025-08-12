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
} from "@nestjs/common";
import { Request, Response } from "express";
import {
  ErrorMonitoringService,
  ErrorSeverity,
} from "../services/error-monitoring.service";
import { QueryFailedError } from "typeorm";

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: string; // symbolic / status name
  path: string;
  timestamp: string;
  correlationId?: string;
  errors?: string[] | Record<string, string[]>; // field validation errors
  stack?: string; // only in non-production
}

/**
 * Global exception filter that catches all exceptions
 * and formats them into a consistent response format
 */
@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("GlobalExceptionFilter");

  constructor(private errorMonitoringService: ErrorMonitoringService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate a correlation ID for tracking this error
    const correlationId = this.generateCorrelationId();
    const status = this.getHttpStatus(exception);
    const { message, validationErrors } =
      this.getErrorMessageAndDetails(exception);

    // Determine error severity based on status code
    const severity = this.getErrorSeverity(status);

    // Capture error for monitoring
    this.captureError(exception as Error, severity, request, correlationId);

    // Log the error
    this.logError(exception, request, correlationId, status);

    // Send error response
    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      message,
      error: this.getErrorName(exception),
      path: request.url,
      timestamp: new Date().toISOString(),
      correlationId,
      errors: validationErrors,
    };

    // In production, remove stack traces and sensitive information
    if (process.env.NODE_ENV === "production") {
      // nothing extra (stack omitted)
    } else {
      // Add stack trace for development
      if (exception instanceof Error) {
        errorResponse.stack = exception.stack;
      }
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Get HTTP status code from exception
   * @param exception - Exception object
   * @returns HTTP status code
   */
  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    if (exception instanceof QueryFailedError) return HttpStatus.BAD_REQUEST;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Get error message from exception
   * @param exception - Exception object
   * @returns Error message
   */
  private getErrorMessageAndDetails(exception: unknown): {
    message: string;
    validationErrors?: string[] | Record<string, string[]>;
  } {
    // HttpExceptions may carry validation arrays
    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      if (typeof resp === "string") {
        return { message: resp };
      }
      if (typeof resp === "object" && resp) {
        const obj = resp as Record<string, unknown>;
        const rawMessage = obj.message;
        const message = Array.isArray(rawMessage)
          ? rawMessage.join(", ")
          : typeof rawMessage === "string"
            ? rawMessage
            : exception.message;
        // Nest validation pipe yields: { statusCode, message: string[], error: 'Bad Request' }
        if (Array.isArray(rawMessage)) {
          const coerced = rawMessage.map((m) => String(m));
          return {
            message,
            validationErrors: this.formatValidationArray(coerced),
          };
        }
        return { message };
      }
      return { message: exception.message };
    }

    if (exception instanceof QueryFailedError) {
      return {
        message: this.formatDatabaseError(exception as QueryFailedError),
      };
    }

    if (exception instanceof Error) {
      return { message: exception.message || "Internal server error" };
    }

    return { message: "Internal server error" };
  }

  /**
   * Get error name from exception
   * @param exception - Exception object
   * @returns Error name
   */
  private getErrorName(exception: unknown): string {
    if (exception instanceof HttpException) {
      return HttpStatus[exception.getStatus()] || "HttpException";
    }
    if (exception instanceof QueryFailedError) return "QueryFailedError";
    if (exception instanceof Error) return exception.name || "Error";
    return "UnknownError";
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
    exception: Error,
    severity: ErrorSeverity,
    request: Request,
    correlationId: string,
  ): void {
    // Create error context with request information
    const context = {
      path: request.url,
      method: request.method,
      query: request.query as Record<string, unknown>,
      // Avoid logging sensitive information
      body: this.sanitizeRequestBody(request.body),
      userId:
        (request as unknown as { user?: { id?: number } }).user?.id !==
        undefined
          ? `${(request as unknown as { user?: { id?: number } }).user?.id}`
          : undefined,
      metadata: {
        correlationId,
        userAgent: request.headers["user-agent"],
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
    exception: unknown,
    request: Request,
    correlationId: string,
    status: number,
  ): void {
    const message = `${request.method} ${request.url} - ${status} - ${correlationId}`;
    const errMsg = this.normalizeErrorValue(exception);
    if (status >= 500) {
      this.logger.error(
        `${message} - ${errMsg}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(`${message} - ${errMsg}`);
    } else {
      this.logger.log(`${message} - ${errMsg}`);
    }
  }

  /** Normalize unknown exception value into safe log string */
  private normalizeErrorValue(exception: unknown): string {
    if (exception instanceof Error) return exception.message;
    if (exception === null || exception === undefined) return "Unknown";
    const t = typeof exception;
    if (t === "string" || t === "number" || t === "boolean") {
      return String(exception);
    }
    try {
      return JSON.stringify(exception);
    } catch {
      return "[Unstringifiable Object]";
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
  private sanitizeRequestBody(body: unknown): Record<string, unknown> {
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      body === null
    ) {
      return {};
    }
    const original = body as Record<string, unknown>;
    const sanitized: Record<string, unknown> = { ...original };
    const sensitiveFields = [
      "password",
      "passwordConfirmation",
      "currentPassword",
      "newPassword",
      "token",
      "accessToken",
      "refreshToken",
      "credit_card",
      "creditCard",
      "ssn",
      "socialSecurityNumber",
    ];
    for (const field of sensitiveFields) {
      if (field in sanitized) sanitized[field] = "[REDACTED]";
    }
    return sanitized;
  }

  private formatValidationArray(
    messages: string[],
  ): Record<string, string[]> | string[] {
    // Basic heuristic: messages like "field must not be empty"
    const fieldRegex = /^([^\s]+)\s.+/;
    const grouped: Record<string, string[]> = {};
    let structured = false;
    for (const msg of messages) {
      const match = fieldRegex.exec(msg);
      if (!match) continue;
      structured = true;
      const field = match[1];
      if (!grouped[field]) grouped[field] = [];
      grouped[field].push(msg);
    }
    return structured ? grouped : messages;
  }

  private formatDatabaseError(err: QueryFailedError): string {
    const message = err.message || "Database error";
    if (message.includes("Duplicate entry")) return "Duplicate record";
    if (message.includes("foreign key constraint"))
      return "Related data constraint violation";
    return process.env.NODE_ENV === "development"
      ? message
      : "A database error occurred";
  }
}
