import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ValidationError } from "class-validator";
import { QueryFailedError } from "typeorm";

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[] | Record<string, string[]>;
  timestamp: string;
  path: string;
  statusCode: number;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let errors: string[] | Record<string, string[]> | undefined;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || "Bad Request";

        // Handle validation errors from class-validator
        if (responseObj.message && Array.isArray(responseObj.message)) {
          errors = this.formatValidationErrors(responseObj.message);
        }
      }
    } else if (exception instanceof QueryFailedError) {
      // Handle database errors
      status = HttpStatus.BAD_REQUEST;
      message = this.formatDatabaseError(exception);
    } else if (exception instanceof Error) {
      // Handle generic errors
      message = exception.message || "Internal server error";
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    } else {
      // Handle unknown exceptions
      this.logger.error("Unknown exception occurred", exception);
    }

    // Log the error with appropriate level
    this.logError(exception, request, status);

    const errorResponse: ErrorResponse = {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      statusCode: status,
    };

    response.status(status).json(errorResponse);
  }

  private formatValidationErrors(
    validationErrors: any[],
  ): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    validationErrors.forEach((error) => {
      if (typeof error === "string") {
        // Simple string error
        if (!formattedErrors.general) {
          formattedErrors.general = [];
        }
        formattedErrors.general.push(error);
      } else if (error.property && error.constraints) {
        // ValidationError from class-validator
        formattedErrors[error.property] = Object.values(error.constraints);
      }
    });

    return formattedErrors;
  }

  private formatDatabaseError(error: QueryFailedError): string {
    const message = error.message;

    // Handle common database errors
    if (message.includes("Duplicate entry")) {
      const match = message.match(/Duplicate entry '(.+)' for key '(.+)'/);
      if (match) {
        const [, value, key] = match;
        return `A record with ${key.replace("_", " ")} '${value}' already exists`;
      }
      return "A record with this information already exists";
    }

    if (message.includes("foreign key constraint")) {
      return "Cannot perform this operation due to related data dependencies";
    }

    if (message.includes("Data too long")) {
      return "One or more fields exceed the maximum allowed length";
    }

    if (message.includes("cannot be null")) {
      const match = message.match(/Column '(.+)' cannot be null/);
      if (match) {
        return `${match[1].replace("_", " ")} is required`;
      }
      return "Required field is missing";
    }

    // Return generic database error message for production
    return process.env.NODE_ENV === "development"
      ? `Database error: ${message}`
      : "A database error occurred";
  }

  private logError(exception: unknown, request: Request, status: number) {
    const { method, url, body, query, params } = request;
    const userAgent = request.get("User-Agent") || "";
    const ip = request.ip;

    const logContext = {
      method,
      url,
      body: this.sanitizeLogData(body),
      query,
      params,
      userAgent,
      ip,
      statusCode: status,
    };

    if (status >= 500) {
      // Server errors - log as error
      this.logger.error(
        `${method} ${url} - ${status}`,
        exception instanceof Error ? exception.stack : exception,
        JSON.stringify(logContext, null, 2),
      );
    } else if (status >= 400) {
      // Client errors - log as warning
      this.logger.warn(
        `${method} ${url} - ${status}: ${exception instanceof Error ? exception.message : "Client error"}`,
        JSON.stringify(logContext, null, 2),
      );
    }
  }

  private sanitizeLogData(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveFields = ["password", "token", "authorization", "secret"];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    }

    return sanitized;
  }
}
