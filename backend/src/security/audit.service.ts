import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityConfigService } from './security.config';
import { SanitizationService } from './sanitization.service';

export interface AuditLogEntry {
  id?: number;
  timestamp: Date;
  userId?: number;
  username?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private securityConfig: SecurityConfigService,
    private sanitizationService: SanitizationService,
  ) {}

  /**
   * Log a security-sensitive operation
   */
  async logSecurityEvent(
    action: string,
    resource: string,
    success: boolean,
    options: {
      userId?: number;
      username?: string;
      resourceId?: string;
      ipAddress?: string;
      userAgent?: string;
      errorMessage?: string;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<void> {
    const config = this.securityConfig.getSecurityConfig().audit;
    
    if (!config.enabled) {
      return;
    }

    const auditEntry: AuditLogEntry = {
      timestamp: new Date(),
      userId: options.userId,
      username: options.username,
      action,
      resource,
      resourceId: options.resourceId,
      ipAddress: options.ipAddress || 'unknown',
      userAgent: options.userAgent || 'unknown',
      success,
      errorMessage: options.errorMessage,
      metadata: options.metadata ? this.sanitizationService.sanitizeForLogging(options.metadata) : undefined,
    };

    // Log to console/file
    const logMessage = this.formatAuditLogMessage(auditEntry);
    
    if (success) {
      this.logger.log(logMessage, 'AUDIT');
    } else {
      this.logger.warn(logMessage, 'AUDIT');
    }

    // In a production environment, you might want to store audit logs in a separate database
    // or send them to a centralized logging system like ELK stack, Splunk, etc.
    // For now, we'll just log to the console/file
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    action: 'login' | 'logout' | 'signup' | 'password-change' | 'token-refresh',
    success: boolean,
    options: {
      userId?: number;
      username?: string;
      ipAddress?: string;
      userAgent?: string;
      errorMessage?: string;
    } = {},
  ): Promise<void> {
    await this.logSecurityEvent(action, 'authentication', success, options);
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    action: 'create' | 'read' | 'update' | 'delete',
    resource: string,
    success: boolean,
    options: {
      userId?: number;
      username?: string;
      resourceId?: string;
      ipAddress?: string;
      userAgent?: string;
      errorMessage?: string;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<void> {
    await this.logSecurityEvent(`${resource}-${action}`, resource, success, options);
  }

  /**
   * Log permission/authorization events
   */
  async logAuthorizationEvent(
    action: string,
    resource: string,
    success: boolean,
    options: {
      userId?: number;
      username?: string;
      requiredPermission?: string;
      ipAddress?: string;
      userAgent?: string;
      errorMessage?: string;
    } = {},
  ): Promise<void> {
    await this.logSecurityEvent(
      action,
      resource,
      success,
      {
        ...options,
        metadata: {
          requiredPermission: options.requiredPermission,
        },
      },
    );
  }

  /**
   * Log security violations
   */
  async logSecurityViolation(
    violationType: 'rate-limit' | 'csrf' | 'xss-attempt' | 'sql-injection' | 'unauthorized-access',
    details: {
      ipAddress?: string;
      userAgent?: string;
      userId?: number;
      username?: string;
      requestData?: any;
      errorMessage?: string;
    } = {},
  ): Promise<void> {
    await this.logSecurityEvent(
      violationType,
      'security-violation',
      false,
      {
        ...details,
        metadata: {
          violationType,
          requestData: details.requestData ? this.sanitizationService.sanitizeForLogging(details.requestData) : undefined,
        },
      },
    );
  }

  /**
   * Format audit log message for consistent logging
   */
  private formatAuditLogMessage(entry: AuditLogEntry): string {
    const parts = [
      `[${entry.timestamp.toISOString()}]`,
      `ACTION=${entry.action}`,
      `RESOURCE=${entry.resource}`,
      `SUCCESS=${entry.success}`,
      `USER=${entry.username || 'anonymous'}(${entry.userId || 'N/A'})`,
      `IP=${entry.ipAddress}`,
    ];

    if (entry.resourceId) {
      parts.push(`RESOURCE_ID=${entry.resourceId}`);
    }

    if (entry.errorMessage) {
      parts.push(`ERROR="${entry.errorMessage}"`);
    }

    if (entry.metadata) {
      parts.push(`METADATA=${JSON.stringify(entry.metadata)}`);
    }

    return parts.join(' | ');
  }

  /**
   * Check if an operation should be audited
   */
  shouldAuditOperation(operation: string): boolean {
    const config = this.securityConfig.getSecurityConfig().audit;
    return config.enabled && config.sensitiveOperations.includes(operation);
  }
}