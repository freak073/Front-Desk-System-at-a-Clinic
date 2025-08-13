import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const AUDIT_METADATA_KEY = 'audit';

export interface AuditMetadata {
  action: string;
  resource: string;
  description?: string;
}

/**
 * Decorator to mark methods for audit logging
 */
export const Audit = (metadata: AuditMetadata) => SetMetadata(AUDIT_METADATA_KEY, metadata);

/**
 * Decorator to extract audit context from request
 */
export const AuditContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    
    return {
      userId: user?.id,
      username: user?.username,
      ipAddress: request.ip || request.connection.remoteAddress,
      userAgent: request.headers['user-agent'],
    };
  },
);