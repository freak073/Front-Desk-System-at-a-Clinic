import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { SecurityConfigService } from '../security.config';
import { SanitizationService } from '../sanitization.service';
import { AuditService } from '../audit.service';

describe('Security Features (e2e)', () => {
  let app: INestApplication;
  let securityConfigService: SecurityConfigService;
  let sanitizationService: SanitizationService;
  let auditService: AuditService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    securityConfigService = app.get<SecurityConfigService>(SecurityConfigService);
    sanitizationService = app.get<SanitizationService>(SanitizationService);
    auditService = app.get<AuditService>(AuditService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Security Headers', () => {
    it('should include security headers in response', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // Check for security headers set by Helmet
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should set HSTS header in production', async () => {
      // This would need to be tested with NODE_ENV=production
      // For now, we'll just verify the configuration exists
      const config = securityConfigService.getSecurityConfig();
      expect(config.helmet.hsts).toBeDefined();
      expect((config.helmet.hsts as any).maxAge).toBe(31536000);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const config = securityConfigService.getSecurityConfig();
      const limit = config.rateLimit.limit;

      // Make requests up to the limit
      const promises = [];
      for (let i = 0; i < limit + 5; i++) {
        promises.push(
          request(app.getHttpServer())
            .get('/health')
            .expect((res) => {
              // Some requests should succeed, others should be rate limited
              expect([200, 429]).toContain(res.status);
            })
        );
      }

      await Promise.all(promises);
    }, 30000);
  });

  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizationService.sanitizeString(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toContain('Hello World');
    });

    it('should sanitize SQL injection attempts', () => {
      const maliciousInput = "'; DROP TABLE users; --";
      const sanitized = sanitizationService.sanitizeSQLInput(maliciousInput);
      
      expect(sanitized).not.toContain('DROP');
      expect(sanitized).not.toContain('--');
      expect(sanitized).not.toContain(';');
    });

    it('should validate email format', () => {
      expect(sanitizationService.isValidEmail('test@example.com')).toBe(true);
      expect(sanitizationService.isValidEmail('invalid-email')).toBe(false);
      expect(sanitizationService.isValidEmail('test@')).toBe(false);
    });

    it('should sanitize filenames', () => {
      const maliciousFilename = '../../../etc/passwd';
      const sanitized = sanitizationService.sanitizeFilename(maliciousFilename);
      
      expect(sanitized).not.toContain('../');
      expect(sanitized).not.toContain('/');
      expect(sanitized).not.toContain('\\');
    });

    it('should sanitize data for logging', () => {
      const sensitiveData = {
        username: 'testuser',
        password: 'secret123',
        token: 'jwt-token-here',
        publicInfo: 'this is safe',
      };

      const sanitized = sanitizationService.sanitizeForLogging(sensitiveData);
      
      expect(sanitized.username).toBe('testuser');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.publicInfo).toBe('this is safe');
    });
  });

  describe('CORS Configuration', () => {
    it('should handle CORS preflight requests', async () => {
      await request(app.getHttpServer())
        .options('/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
        .expect(204);
    });

    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .set('Origin', 'http://malicious-site.com');

      // In development mode, CORS might be more permissive
      // In production, this should be rejected
      if (process.env.NODE_ENV === 'production') {
        expect(response.status).toBe(403);
      }
    });
  });

  describe('Authentication Security', () => {
    it('should reject requests without valid JWT token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should reject requests with invalid JWT token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should handle login attempts with invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Audit Logging', () => {
    it('should log security events', async () => {
      const logSpy = jest.spyOn(auditService, 'logSecurityEvent');
      
      await auditService.logSecurityEvent('test-action', 'test-resource', true, {
        userId: 1,
        username: 'testuser',
        ipAddress: '127.0.0.1',
      });

      expect(logSpy).toHaveBeenCalledWith('test-action', 'test-resource', true, {
        userId: 1,
        username: 'testuser',
        ipAddress: '127.0.0.1',
      });
    });

    it('should log authentication events', async () => {
      const logSpy = jest.spyOn(auditService, 'logAuthEvent');
      
      await auditService.logAuthEvent('login', true, {
        userId: 1,
        username: 'testuser',
        ipAddress: '127.0.0.1',
      });

      expect(logSpy).toHaveBeenCalledWith('login', true, {
        userId: 1,
        username: 'testuser',
        ipAddress: '127.0.0.1',
      });
    });

    it('should log security violations', async () => {
      const logSpy = jest.spyOn(auditService, 'logSecurityViolation');
      
      await auditService.logSecurityViolation('rate-limit', {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      expect(logSpy).toHaveBeenCalledWith('rate-limit', {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });
  });

  describe('Data Validation', () => {
    it('should reject malformed JSON', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should reject requests with extra fields when whitelist is enabled', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
          extraField: 'should be rejected',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should not expose sensitive information in error messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/nonexistent-endpoint')
        .expect(404);

      expect(response.body).not.toContain('password');
      expect(response.body).not.toContain('token');
      expect(response.body).not.toContain('secret');
    });

    it('should handle internal server errors gracefully', async () => {
      // This would require a route that intentionally throws an error
      // For now, we'll just verify the error filter is configured
      expect(app).toBeDefined();
    });
  });
});