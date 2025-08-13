import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityConfigService } from './security.config';
import { SanitizationService } from './sanitization.service';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './audit.interceptor';
import { CSRFMiddleware } from './csrf.middleware';
import { CSRFController } from './csrf.controller';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [CSRFController],
  providers: [
    SecurityConfigService,
    SanitizationService,
    AuditService,
    AuditInterceptor,
    CSRFMiddleware,
  ],
  exports: [
    SecurityConfigService,
    SanitizationService,
    AuditService,
    AuditInterceptor,
    CSRFMiddleware,
  ],
})
export class SecurityModule {}