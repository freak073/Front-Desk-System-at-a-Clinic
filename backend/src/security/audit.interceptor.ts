import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { AUDIT_METADATA_KEY, AuditMetadata } from './audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditService: AuditService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    const startTime = Date.now();

    const auditContext = {
      userId: user?.id,
      username: user?.username,
      ipAddress: request.ip || request.connection.remoteAddress,
      userAgent: request.headers['user-agent'],
    };

    return next.handle().pipe(
      tap((response) => {
        // Log successful operation
        const duration = Date.now() - startTime;
        this.auditService.logSecurityEvent(
          auditMetadata.action,
          auditMetadata.resource,
          true,
          {
            ...auditContext,
            metadata: {
              description: auditMetadata.description,
              duration,
              responseSize: JSON.stringify(response).length,
            },
          },
        );
      }),
      catchError((error) => {
        // Log failed operation
        const duration = Date.now() - startTime;
        this.auditService.logSecurityEvent(
          auditMetadata.action,
          auditMetadata.resource,
          false,
          {
            ...auditContext,
            errorMessage: error.message,
            metadata: {
              description: auditMetadata.description,
              duration,
              errorType: error.constructor.name,
              statusCode: error.status,
            },
          },
        );
        return throwError(() => error);
      }),
    );
  }
}