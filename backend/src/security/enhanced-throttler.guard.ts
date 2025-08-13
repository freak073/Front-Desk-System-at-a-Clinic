import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class EnhancedThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(EnhancedThrottlerGuard.name);

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: any,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    // Log rate limiting violation
    this.logger.warn(
      `Rate limit exceeded for ${request.ip} - ${request.method} ${request.url}`,
      {
        userId: user?.id,
        username: user?.username,
        ipAddress: request.ip || request.connection.remoteAddress,
        userAgent: request.headers['user-agent'],
        method: request.method,
        url: request.url,
        limit: throttlerLimitDetail.limit,
        ttl: throttlerLimitDetail.ttl,
      }
    );

    throw new ThrottlerException();
  }
}