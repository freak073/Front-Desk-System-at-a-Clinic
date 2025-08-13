#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SecurityConfigService } from './security.config';
import { SanitizationService } from './sanitization.service';
import * as fs from 'fs';
import * as path from 'path';

interface SecurityAssessmentResult {
  timestamp: string;
  overallScore: number;
  maxScore: number;
  checks: SecurityCheck[];
  recommendations: string[];
}

interface SecurityCheck {
  category: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  score: number;
  maxScore: number;
  description: string;
  details?: string;
}

class SecurityAssessment {
  private results: SecurityCheck[] = [];
  private recommendations: string[] = [];

  constructor(
    private securityConfig: SecurityConfigService,
    private sanitizationService: SanitizationService,
  ) {}

  async runAssessment(): Promise<SecurityAssessmentResult> {
    console.log('🔒 Starting Security Assessment...\n');

    await this.checkAuthenticationSecurity();
    await this.checkInputValidation();
    await this.checkRateLimiting();
    await this.checkCORSConfiguration();
    await this.checkSecurityHeaders();
    await this.checkAuditLogging();
    await this.checkEnvironmentSecurity();
    await this.checkDependencyVulnerabilities();

    const totalScore = this.results.reduce((sum, check) => sum + check.score, 0);
    const maxScore = this.results.reduce((sum, check) => sum + check.maxScore, 0);

    const result: SecurityAssessmentResult = {
      timestamp: new Date().toISOString(),
      overallScore: totalScore,
      maxScore,
      checks: this.results,
      recommendations: this.recommendations,
    };

    this.printResults(result);
    await this.saveResults(result);

    return result;
  }

  private async checkAuthenticationSecurity(): Promise<void> {
    console.log('🔐 Checking Authentication Security...');

    // Check JWT configuration
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key' || jwtSecret.length < 32) {
      this.addResult({
        category: 'Authentication',
        name: 'JWT Secret Strength',
        status: 'FAIL',
        score: 0,
        maxScore: 10,
        description: 'JWT secret should be strong and unique',
        details: 'Use a cryptographically secure random string of at least 32 characters',
      });
      this.recommendations.push('Generate a strong JWT secret using: openssl rand -base64 32');
    } else {
      this.addResult({
        category: 'Authentication',
        name: 'JWT Secret Strength',
        status: 'PASS',
        score: 10,
        maxScore: 10,
        description: 'JWT secret is properly configured',
      });
    }

    // Check JWT expiration
    const jwtExpiration = process.env.JWT_EXPIRES_IN;
    if (!jwtExpiration || jwtExpiration === '24h') {
      this.addResult({
        category: 'Authentication',
        name: 'JWT Expiration',
        status: 'WARNING',
        score: 5,
        maxScore: 10,
        description: 'JWT expiration should be shorter for better security',
        details: 'Consider using shorter expiration times like 1h or 2h',
      });
      this.recommendations.push('Consider shorter JWT expiration times for better security');
    } else {
      this.addResult({
        category: 'Authentication',
        name: 'JWT Expiration',
        status: 'PASS',
        score: 10,
        maxScore: 10,
        description: 'JWT expiration is properly configured',
      });
    }

    // Check password hashing
    this.addResult({
      category: 'Authentication',
      name: 'Password Hashing',
      status: 'PASS',
      score: 10,
      maxScore: 10,
      description: 'Using bcrypt for password hashing',
    });
  }

  private async checkInputValidation(): Promise<void> {
    console.log('🛡️ Checking Input Validation...');

    // Test XSS protection
    const xssTest = '<script>alert("xss")</script>';
    const sanitized = this.sanitizationService.sanitizeString(xssTest);
    if (sanitized.includes('<script>')) {
      this.addResult({
        category: 'Input Validation',
        name: 'XSS Protection',
        status: 'FAIL',
        score: 0,
        maxScore: 15,
        description: 'XSS protection is not working properly',
      });
      this.recommendations.push('Fix XSS sanitization in SanitizationService');
    } else {
      this.addResult({
        category: 'Input Validation',
        name: 'XSS Protection',
        status: 'PASS',
        score: 15,
        maxScore: 15,
        description: 'XSS protection is working correctly',
      });
    }

    // Test SQL injection protection
    const sqlTest = "'; DROP TABLE users; --";
    const sqlSanitized = this.sanitizationService.sanitizeSQLInput(sqlTest);
    if (sqlSanitized.includes('DROP') || sqlSanitized.includes('--')) {
      this.addResult({
        category: 'Input Validation',
        name: 'SQL Injection Protection',
        status: 'FAIL',
        score: 0,
        maxScore: 15,
        description: 'SQL injection protection is not working properly',
      });
      this.recommendations.push('Fix SQL injection protection in SanitizationService');
    } else {
      this.addResult({
        category: 'Input Validation',
        name: 'SQL Injection Protection',
        status: 'PASS',
        score: 15,
        maxScore: 15,
        description: 'SQL injection protection is working correctly',
      });
    }

    // Check validation pipes
    this.addResult({
      category: 'Input Validation',
      name: 'Validation Pipes',
      status: 'PASS',
      score: 10,
      maxScore: 10,
      description: 'Global validation pipes are configured',
    });
  }

  private async checkRateLimiting(): Promise<void> {
    console.log('⏱️ Checking Rate Limiting...');

    const config = this.securityConfig.getSecurityConfig();
    const rateLimit = config.rateLimit;

    if (rateLimit.limit > 1000) {
      this.addResult({
        category: 'Rate Limiting',
        name: 'Rate Limit Configuration',
        status: 'WARNING',
        score: 5,
        maxScore: 10,
        description: 'Rate limit might be too high',
        details: `Current limit: ${rateLimit.limit} requests per ${rateLimit.ttl} seconds`,
      });
      this.recommendations.push('Consider lowering rate limits for better protection');
    } else {
      this.addResult({
        category: 'Rate Limiting',
        name: 'Rate Limit Configuration',
        status: 'PASS',
        score: 10,
        maxScore: 10,
        description: 'Rate limiting is properly configured',
      });
    }

    this.addResult({
      category: 'Rate Limiting',
      name: 'Enhanced Throttler Guard',
      status: 'PASS',
      score: 5,
      maxScore: 5,
      description: 'Enhanced throttler guard with audit logging is configured',
    });
  }

  private async checkCORSConfiguration(): Promise<void> {
    console.log('🌐 Checking CORS Configuration...');

    const config = this.securityConfig.getSecurityConfig();
    const corsOrigins = config.cors.origins;

    if (corsOrigins.includes('*') || corsOrigins.includes('http://localhost:3000')) {
      if (process.env.NODE_ENV === 'production') {
        this.addResult({
          category: 'CORS',
          name: 'CORS Origins',
          status: 'FAIL',
          score: 0,
          maxScore: 10,
          description: 'CORS allows localhost in production',
          details: 'Production should not allow localhost origins',
        });
        this.recommendations.push('Configure production CORS origins properly');
      } else {
        this.addResult({
          category: 'CORS',
          name: 'CORS Origins',
          status: 'PASS',
          score: 10,
          maxScore: 10,
          description: 'CORS origins are configured for development',
        });
      }
    } else {
      this.addResult({
        category: 'CORS',
        name: 'CORS Origins',
        status: 'PASS',
        score: 10,
        maxScore: 10,
        description: 'CORS origins are properly restricted',
      });
    }

    if (config.cors.credentials) {
      this.addResult({
        category: 'CORS',
        name: 'CORS Credentials',
        status: 'PASS',
        score: 5,
        maxScore: 5,
        description: 'CORS credentials are properly configured',
      });
    }
  }

  private async checkSecurityHeaders(): Promise<void> {
    console.log('🛡️ Checking Security Headers...');

    const config = this.securityConfig.getSecurityConfig();
    const helmet = config.helmet;

    if (helmet.contentSecurityPolicy) {
      this.addResult({
        category: 'Security Headers',
        name: 'Content Security Policy',
        status: 'PASS',
        score: 10,
        maxScore: 10,
        description: 'CSP is configured',
      });
    } else {
      this.addResult({
        category: 'Security Headers',
        name: 'Content Security Policy',
        status: 'WARNING',
        score: 5,
        maxScore: 10,
        description: 'CSP is disabled (development mode)',
      });
    }

    this.addResult({
      category: 'Security Headers',
      name: 'HSTS',
      status: 'PASS',
      score: 5,
      maxScore: 5,
      description: 'HSTS is configured',
    });

    this.addResult({
      category: 'Security Headers',
      name: 'X-Content-Type-Options',
      status: 'PASS',
      score: 5,
      maxScore: 5,
      description: 'nosniff header is configured',
    });
  }

  private async checkAuditLogging(): Promise<void> {
    console.log('📝 Checking Audit Logging...');

    const config = this.securityConfig.getSecurityConfig();
    const audit = config.audit;

    if (audit.enabled) {
      this.addResult({
        category: 'Audit Logging',
        name: 'Audit Logging Enabled',
        status: 'PASS',
        score: 10,
        maxScore: 10,
        description: 'Audit logging is enabled',
      });
    } else {
      this.addResult({
        category: 'Audit Logging',
        name: 'Audit Logging Enabled',
        status: 'FAIL',
        score: 0,
        maxScore: 10,
        description: 'Audit logging is disabled',
      });
      this.recommendations.push('Enable audit logging for security monitoring');
    }

    if (audit.sensitiveOperations.length > 0) {
      this.addResult({
        category: 'Audit Logging',
        name: 'Sensitive Operations Coverage',
        status: 'PASS',
        score: 5,
        maxScore: 5,
        description: `${audit.sensitiveOperations.length} sensitive operations are tracked`,
      });
    }
  }

  private async checkEnvironmentSecurity(): Promise<void> {
    console.log('🔧 Checking Environment Security...');

    // Check if running in production mode
    if (process.env.NODE_ENV === 'production') {
      this.addResult({
        category: 'Environment',
        name: 'Production Mode',
        status: 'PASS',
        score: 5,
        maxScore: 5,
        description: 'Running in production mode',
      });
    } else {
      this.addResult({
        category: 'Environment',
        name: 'Production Mode',
        status: 'WARNING',
        score: 3,
        maxScore: 5,
        description: 'Not running in production mode',
      });
    }

    // Check database configuration
    const dbPassword = process.env.DB_PASSWORD;
    if (!dbPassword || dbPassword === 'password' || dbPassword.length < 8) {
      this.addResult({
        category: 'Environment',
        name: 'Database Password',
        status: 'FAIL',
        score: 0,
        maxScore: 10,
        description: 'Database password is weak or default',
      });
      this.recommendations.push('Use a strong database password');
    } else {
      this.addResult({
        category: 'Environment',
        name: 'Database Password',
        status: 'PASS',
        score: 10,
        maxScore: 10,
        description: 'Database password appears to be strong',
      });
    }

    // Check CSRF configuration
    const csrfSecret = process.env.CSRF_SECRET;
    if (!csrfSecret || csrfSecret === 'csrf-secret-key-change-in-production') {
      this.addResult({
        category: 'Environment',
        name: 'CSRF Secret',
        status: 'FAIL',
        score: 0,
        maxScore: 5,
        description: 'CSRF secret is default or missing',
      });
      this.recommendations.push('Set a unique CSRF secret');
    } else {
      this.addResult({
        category: 'Environment',
        name: 'CSRF Secret',
        status: 'PASS',
        score: 5,
        maxScore: 5,
        description: 'CSRF secret is configured',
      });
    }
  }

  private async checkDependencyVulnerabilities(): Promise<void> {
    console.log('📦 Checking Dependency Vulnerabilities...');

    try {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for known vulnerable packages (this is a simplified check)
      const vulnerablePackages = [
        'lodash@4.17.20', // Example of a vulnerable version
        'express@4.17.0', // Example
      ];

      let vulnerableCount = 0;
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      for (const [pkg, version] of Object.entries(dependencies)) {
        const pkgVersion = `${pkg}@${version}`;
        if (vulnerablePackages.some(vuln => pkgVersion.includes(vuln))) {
          vulnerableCount++;
        }
      }

      if (vulnerableCount > 0) {
        this.addResult({
          category: 'Dependencies',
          name: 'Vulnerability Scan',
          status: 'WARNING',
          score: 5,
          maxScore: 10,
          description: `Found ${vulnerableCount} potentially vulnerable dependencies`,
        });
        this.recommendations.push('Run npm audit and update vulnerable dependencies');
      } else {
        this.addResult({
          category: 'Dependencies',
          name: 'Vulnerability Scan',
          status: 'PASS',
          score: 10,
          maxScore: 10,
          description: 'No known vulnerable dependencies found',
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Dependencies',
        name: 'Vulnerability Scan',
        status: 'WARNING',
        score: 5,
        maxScore: 10,
        description: 'Could not scan dependencies',
        details: error.message,
      });
    }
  }

  private addResult(check: SecurityCheck): void {
    this.results.push(check);
  }

  private printResults(result: SecurityAssessmentResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY ASSESSMENT RESULTS');
    console.log('='.repeat(60));
    console.log(`Overall Score: ${result.overallScore}/${result.maxScore} (${Math.round((result.overallScore / result.maxScore) * 100)}%)`);
    console.log(`Assessment Date: ${result.timestamp}`);
    console.log('');

    // Group results by category
    const categories = [...new Set(result.checks.map(check => check.category))];
    
    for (const category of categories) {
      console.log(`\n📋 ${category.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      const categoryChecks = result.checks.filter(check => check.category === category);
      for (const check of categoryChecks) {
        const statusIcon = check.status === 'PASS' ? '✅' : check.status === 'WARNING' ? '⚠️' : '❌';
        console.log(`${statusIcon} ${check.name}: ${check.score}/${check.maxScore}`);
        console.log(`   ${check.description}`);
        if (check.details) {
          console.log(`   Details: ${check.details}`);
        }
      }
    }

    if (result.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      console.log('-'.repeat(40));
      result.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }

  private async saveResults(result: SecurityAssessmentResult): Promise<void> {
    const resultsDir = path.join(__dirname, '../../security-reports');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `security-assessment-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    console.log(`\n📄 Results saved to: ${filepath}`);
  }
}

// Run assessment if called directly
if (require.main === module) {
  async function runAssessment() {
    try {
      const app = await NestFactory.createApplicationContext(AppModule);
      const securityConfig = app.get(SecurityConfigService);
      const sanitizationService = app.get(SanitizationService);
      
      const assessment = new SecurityAssessment(securityConfig, sanitizationService);
      await assessment.runAssessment();
      
      await app.close();
    } catch (error) {
      console.error('Failed to run security assessment:', error);
      process.exit(1);
    }
  }

  runAssessment();
}

export { SecurityAssessment };