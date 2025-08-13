import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SecurityConfig {
  csrf: {
    enabled: boolean;
    secret: string;
    cookieName: string;
    headerName: string;
  };
  rateLimit: {
    ttl: number;
    limit: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
  cors: {
    origins: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    maxAge: number;
  };
  helmet: {
    contentSecurityPolicy: boolean | object;
    crossOriginResourcePolicy: object;
    hsts: object;
    noSniff: boolean;
    xssFilter: boolean;
    referrerPolicy: object;
  };
  audit: {
    enabled: boolean;
    sensitiveOperations: string[];
    logLevel: string;
  };
}

@Injectable()
export class SecurityConfigService {
  constructor(private configService: ConfigService) {}

  getSecurityConfig(): SecurityConfig {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    
    return {
      csrf: {
        enabled: this.configService.get('CSRF_ENABLED', 'true') === 'true',
        secret: this.configService.get('CSRF_SECRET', 'csrf-secret-key-change-in-production'),
        cookieName: '_csrf',
        headerName: 'x-csrf-token',
      },
      rateLimit: {
        ttl: parseInt(this.configService.get('RATE_LIMIT_TTL', '60'), 10),
        limit: parseInt(this.configService.get('RATE_LIMIT_LIMIT', '100'), 10),
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
      },
      cors: {
        origins: (this.configService.get('CORS_ORIGINS', 'http://localhost:3000'))
          .split(',')
          .map((o: string) => o.trim()),
        credentials: true,
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-CSRF-Token'],
        maxAge: 600,
      },
      helmet: {
        contentSecurityPolicy: isProduction ? {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        } : false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: { policy: 'same-origin' },
      },
      audit: {
        enabled: this.configService.get('AUDIT_LOGGING_ENABLED', 'true') === 'true',
        sensitiveOperations: [
          'login',
          'logout',
          'signup',
          'password-change',
          'user-create',
          'user-update',
          'user-delete',
          'patient-create',
          'patient-update',
          'patient-delete',
          'doctor-create',
          'doctor-update',
          'doctor-delete',
          'appointment-create',
          'appointment-update',
          'appointment-cancel',
          'queue-add',
          'queue-update',
          'queue-remove',
        ],
        logLevel: this.configService.get('AUDIT_LOG_LEVEL', 'info'),
      },
    };
  }
}