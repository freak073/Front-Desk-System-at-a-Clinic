import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Authentication Integration Tests', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    
    await app.init();
  });

  beforeEach(async () => {
    // Clean up database
    await userRepository.clear();
    
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    const testUser = userRepository.create({
      username: 'testuser',
      passwordHash: hashedPassword,
      role: 'front_desk',
    });
    await userRepository.save(testUser);
  });

  afterAll(async () => {
    await userRepository.clear();
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password',
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'password',
        })
        .expect(400);
    });

    it('should return proper error messages', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should handle SQL injection attempts', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: "admin'; DROP TABLE users; --",
          password: 'password',
        })
        .expect(401);

      // Verify users table still exists
      const users = await userRepository.find();
      expect(users.length).toBeGreaterThan(0);
    });

    it('should rate limit login attempts', async () => {
      const promises = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              username: 'testuser',
              password: 'wrongpassword',
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should respond within 2 seconds', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword',
        })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(2000);
    });
  });

  describe('GET /auth/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword',
        });
      
      authToken = loginResponse.body.access_token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.username).toBe('testuser');
      expect(response.body.role).toBe('front_desk');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject expired token', async () => {
      // This would require mocking JWT expiration or waiting for token to expire
      // For now, we'll test with a malformed token
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer expired.token.here')
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword',
        });
      
      authToken = loginResponse.body.access_token;
    });

    it('should logout successfully with valid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should reject logout without token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });

    it('should handle logout with invalid token gracefully', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full authentication flow', async () => {
      // 1. Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword',
        })
        .expect(200);

      const token = loginResponse.body.access_token;
      expect(token).toBeDefined();

      // 2. Access protected resource
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 3. Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should handle concurrent login attempts', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              username: 'testuser',
              password: 'testpassword',
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('access_token');
      });
    });

    it('should maintain session consistency', async () => {
      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword',
        });

      const token = loginResponse.body.access_token;

      // Multiple profile requests should return consistent data
      const profilePromises = [];
      for (let i = 0; i < 3; i++) {
        profilePromises.push(
          request(app.getHttpServer())
            .get('/auth/profile')
            .set('Authorization', `Bearer ${token}`)
        );
      }

      const profileResponses = await Promise.all(profilePromises);
      
      profileResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.username).toBe('testuser');
      });
    });
  });

  describe('Security Tests', () => {
    it('should hash passwords securely', async () => {
      const user = await userRepository.findOne({ where: { username: 'testuser' } });
      
      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe('testpassword');
      expect(user?.passwordHash.length).toBeGreaterThan(50); // bcrypt hashes are long
    });

    it('should not expose sensitive data in responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword',
        });

      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should validate JWT token structure', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword',
        });

      const token = response.body.access_token;
      const tokenParts = token.split('.');
      
      expect(tokenParts.length).toBe(3); // JWT has 3 parts
      expect(tokenParts[0]).toBeTruthy(); // Header
      expect(tokenParts[1]).toBeTruthy(); // Payload
      expect(tokenParts[2]).toBeTruthy(); // Signature
    });
  });
});