import { Injectable } from '@nestjs/common';
import { Transform } from 'class-transformer';

@Injectable()
export class SanitizationService {
  /**
   * Sanitize string input to prevent XSS attacks
   */
  sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return input;
    }

    return input
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Escape special characters
      .replace(/[<>&"']/g, (match) => {
        const escapeMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#x27;',
        };
        return escapeMap[match] || match;
      })
      // Remove potentially dangerous characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Trim whitespace
      .trim();
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize the key as well
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitize SQL input to prevent SQL injection
   */
  sanitizeSQLInput(input: string): string {
    if (typeof input !== 'string') {
      return input;
    }

    return input
      // Remove SQL injection patterns
      .replace(/('|\\')|(;)|(\\)|(--)|(\s*(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+)/gi, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Trim whitespace
      .trim();
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Sanitize filename to prevent directory traversal
   */
  sanitizeFilename(filename: string): string {
    if (typeof filename !== 'string') {
      return filename;
    }

    return filename
      // Remove directory traversal patterns
      .replace(/\.\./g, '')
      .replace(/[\/\\]/g, '')
      // Remove special characters
      .replace(/[<>:"|?*]/g, '')
      // Limit length
      .substring(0, 255)
      .trim();
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  sanitizeForLogging(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeForLogging(item));
    }

    if (typeof data === 'object') {
      const sanitized: any = { ...data };
      const sensitiveFields = [
        'password',
        'passwordHash',
        'token',
        'authorization',
        'secret',
        'key',
        'apiKey',
        'accessToken',
        'refreshToken',
        'sessionId',
        'csrfToken',
        'creditCard',
        'ssn',
        'socialSecurityNumber',
        'bankAccount',
      ];

      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      }

      // Recursively sanitize nested objects
      for (const [key, value] of Object.entries(sanitized)) {
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeForLogging(value);
        }
      }

      return sanitized;
    }

    return data;
  }
}

/**
 * Decorator for automatic string sanitization
 */
export function SanitizeString() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      const sanitizationService = new SanitizationService();
      return sanitizationService.sanitizeString(value);
    }
    return value;
  });
}

/**
 * Decorator for automatic SQL input sanitization
 */
export function SanitizeSQLInput() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      const sanitizationService = new SanitizationService();
      return sanitizationService.sanitizeSQLInput(value);
    }
    return value;
  });
}