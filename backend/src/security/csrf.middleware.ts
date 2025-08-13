import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { SecurityConfigService } from './security.config';

interface CSRFRequest extends Request {
  csrfToken?: string;
}

@Injectable()
export class CSRFMiddleware implements NestMiddleware {
  constructor(private securityConfig: SecurityConfigService) {}

  use(req: CSRFRequest, res: Response, next: NextFunction): void {
    const config = this.securityConfig.getSecurityConfig().csrf;
    
    if (!config.enabled || process.env.NODE_ENV === 'test') {
      return next();
    }

    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Generate and set CSRF token for safe methods
      const token = this.generateCSRFToken();
      req.csrfToken = token;
      res.cookie(config.cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 hour
      });
      return next();
    }

    // For state-changing methods, validate CSRF token
    const tokenFromHeader = req.headers[config.headerName] as string;
    const tokenFromCookie = req.cookies?.[config.cookieName];

    if (!tokenFromHeader || !tokenFromCookie) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (!this.validateCSRFToken(tokenFromHeader, tokenFromCookie)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    next();
  }

  private generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private validateCSRFToken(headerToken: string, cookieToken: string): boolean {
    if (!headerToken || !cookieToken) {
      return false;
    }

    // Use crypto.timingSafeEqual to prevent timing attacks
    try {
      const headerBuffer = Buffer.from(headerToken, 'hex');
      const cookieBuffer = Buffer.from(cookieToken, 'hex');
      
      if (headerBuffer.length !== cookieBuffer.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(headerBuffer, cookieBuffer);
    } catch (error) {
      return false;
    }
  }
}