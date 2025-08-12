/**
 * Error monitoring service for tracking and handling application errors
 */

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Error context interface
 */
export interface ErrorContext {
  /** User ID if available */
  userId?: string;
  /** Request path */
  path?: string;
  /** Request method */
  method?: string;
  /** Request query parameters */
  query?: Record<string, any>;
  /** Request body */
  body?: Record<string, any>;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Error source (service, component, etc.) */
  source?: string;
}

/**
 * Error report interface
 */
export interface ErrorReport {
  /** Error message */
  message: string;
  /** Error stack trace */
  stack?: string;
  /** Error name */
  name?: string;
  /** Error severity */
  severity: ErrorSeverity;
  /** Error timestamp */
  timestamp: Date;
  /** Error context */
  context?: ErrorContext;
  /** Error source (service, component, etc.) */
  source?: string;
}

/**
 * Service for monitoring and handling application errors
 */
@Injectable()
export class ErrorMonitoringService implements OnModuleInit {
  private readonly logger = new Logger("ErrorMonitoringService");
  private readonly enabled: boolean;
  private readonly environment: string;
  private readonly errorStore: ErrorReport[] = [];
  private readonly maxStoredErrors: number;

  constructor(private readonly configService: ConfigService) {
    this.enabled =
      this.configService.get<string>("ERROR_MONITORING_ENABLED", "true") ===
      "true";
    this.environment = this.configService.get<string>(
      "NODE_ENV",
      "development",
    );
    this.maxStoredErrors = this.configService.get<number>(
      "MAX_STORED_ERRORS",
      100,
    );
  }

  onModuleInit() {
    if (this.enabled) {
      this.setupGlobalErrorHandlers();
      this.logger.log(
        `Error monitoring service initialized in ${this.environment} environment`,
      );
    } else {
      this.logger.log("Error monitoring service is disabled");
    }
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers() {
    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      this.captureError(error, ErrorSeverity.CRITICAL, {
        source: "uncaughtException",
      });

      // Log the error
      this.logger.error(`Uncaught Exception: ${error.message}`, error.stack);

      // In production, we might want to gracefully shut down the application
      if (this.environment === "production") {
        // Give the error reporting some time to complete
        setTimeout(() => {
          process.exit(1);
        }, 1000);
      }
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason: any) => {
      const error =
        reason instanceof Error ? reason : new Error(String(reason));
      this.captureError(error, ErrorSeverity.HIGH, {
        source: "unhandledRejection",
      });

      // Log the error
      this.logger.error(`Unhandled Rejection: ${error.message}`, error.stack);
    });
  }

  /**
   * Capture and report an error
   * @param error - Error object
   * @param severity - Error severity
   * @param context - Error context
   */
  captureError(
    error: Error,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext,
  ): void {
    if (!this.enabled) {
      return;
    }

    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      severity,
      timestamp: new Date(),
      context,
    };

    // Store the error locally
    this.storeError(errorReport);

    // Log the error based on severity
    this.logError(errorReport);

    // In a real application, you might want to send the error to an external service
    // this.sendToExternalService(errorReport);
  }

  /**
   * Store error in local memory
   * @param errorReport - Error report
   */
  private storeError(errorReport: ErrorReport): void {
    this.errorStore.push(errorReport);

    // Limit the number of stored errors
    if (this.errorStore.length > this.maxStoredErrors) {
      this.errorStore.shift(); // Remove the oldest error
    }
  }

  /**
   * Log error based on severity
   * @param errorReport - Error report
   */
  private logError(errorReport: ErrorReport): void {
    const { message, stack, severity } = errorReport;

    switch (severity) {
      case ErrorSeverity.CRITICAL:
        this.logger.error(`CRITICAL ERROR: ${message}`, stack);
        break;
      case ErrorSeverity.HIGH:
        this.logger.error(`HIGH SEVERITY: ${message}`, stack);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(`MEDIUM SEVERITY: ${message}`);
        break;
      case ErrorSeverity.LOW:
        this.logger.log(`LOW SEVERITY: ${message}`);
        break;
      default:
        this.logger.log(`ERROR: ${message}`);
    }
  }

  /**
   * Get recent errors
   * @param limit - Maximum number of errors to return
   * @returns Recent error reports
   */
  getRecentErrors(limit: number = 10): ErrorReport[] {
    return this.errorStore.slice(-limit).reverse();
  }

  /**
   * Get errors by severity
   * @param severity - Error severity
   * @param limit - Maximum number of errors to return
   * @returns Error reports with specified severity
   */
  getErrorsBySeverity(
    severity: ErrorSeverity,
    limit: number = 10,
  ): ErrorReport[] {
    return this.errorStore
      .filter((error) => error.severity === severity)
      .slice(-limit)
      .reverse();
  }

  /**
   * Clear stored errors
   */
  clearErrors(): void {
    this.errorStore.length = 0;
    this.logger.log("Error store cleared");
  }

  /**
   * Get error statistics
   * @returns Error statistics
   */
  getErrorStats(): Record<string, any> {
    const totalErrors = this.errorStore.length;
    const bySeverity = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0,
    };

    // Count errors by severity
    this.errorStore.forEach((error) => {
      bySeverity[error.severity]++;
    });

    // Get the most recent error
    const mostRecentError =
      this.errorStore.length > 0
        ? this.errorStore[this.errorStore.length - 1]
        : null;

    return {
      totalErrors,
      bySeverity,
      mostRecentError: mostRecentError
        ? {
            message: mostRecentError.message,
            severity: mostRecentError.severity,
            timestamp: mostRecentError.timestamp,
          }
        : null,
    };
  }
}
