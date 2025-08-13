import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Performance Tests', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    
    await app.init();

    // Create test user and get auth token
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    const testUser = userRepository.create({
      username: 'testuser',
      passwordHash: hashedPassword,
      role: 'front_desk',
    });
    await userRepository.save(testUser);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'testuser',
        password: 'testpassword',
      });
    
    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Response Time Tests', () => {
    it('should respond to login within 2 seconds', async () => {
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

    it('should respond to queue operations within 2 seconds', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .post('/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Performance Test Patient',
          contactInfo: '123-456-7890',
        })
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(2000);
    });

    it('should respond to appointment operations within 2 seconds', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(2000);
    });

    it('should respond to doctor operations within 2 seconds', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/doctors')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(2000);
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle 10 concurrent login requests', async () => {
      const promises = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
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
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(5000);
    });

    it('should handle 20 concurrent queue additions', async () => {
      const promises = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/queue')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              name: `Concurrent Patient ${i}`,
              contactInfo: `${i}23-456-7890`,
            })
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(10000);
    });

    it('should handle mixed concurrent operations', async () => {
      const promises = [];
      const startTime = Date.now();
      
      // Mix of different operations
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app.getHttpServer())
            .get('/queue')
            .set('Authorization', `Bearer ${authToken}`)
        );
        
        promises.push(
          request(app.getHttpServer())
            .get('/doctors')
            .set('Authorization', `Bearer ${authToken}`)
        );
        
        promises.push(
          request(app.getHttpServer())
            .get('/appointments')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(8000);
    });
  });

  describe('Load Testing', () => {
    it('should handle sustained load of queue operations', async () => {
      const batchSize = 10;
      const batches = 5;
      const results = [];
      
      for (let batch = 0; batch < batches; batch++) {
        const promises = [];
        const batchStartTime = Date.now();
        
        for (let i = 0; i < batchSize; i++) {
          promises.push(
            request(app.getHttpServer())
              .post('/queue')
              .set('Authorization', `Bearer ${authToken}`)
              .send({
                name: `Load Test Patient ${batch}-${i}`,
                contactInfo: `${batch}${i}3-456-7890`,
              })
          );
        }
        
        const responses = await Promise.all(promises);
        const batchEndTime = Date.now();
        const batchTime = batchEndTime - batchStartTime;
        
        results.push({
          batch,
          time: batchTime,
          successCount: responses.filter(r => r.status === 201).length,
          totalRequests: batchSize,
        });
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Analyze results
      const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
      const totalSuccesses = results.reduce((sum, r) => sum + r.successCount, 0);
      const averageTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      
      expect(totalSuccesses).toBe(totalRequests); // All should succeed
      expect(averageTime).toBeLessThan(3000); // Average batch time should be reasonable
    });

    it('should maintain performance with large dataset', async () => {
      // First, create a large dataset
      const setupPromises = [];
      for (let i = 0; i < 50; i++) {
        setupPromises.push(
          request(app.getHttpServer())
            .post('/queue')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              name: `Dataset Patient ${i}`,
              contactInfo: `${i}23-456-7890`,
            })
        );
      }
      
      await Promise.all(setupPromises);
      
      // Now test performance with large dataset
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.body.length).toBeGreaterThan(40);
      expect(responseTime).toBeLessThan(2000);
    });

    it('should handle search operations efficiently', async () => {
      // Create test data with searchable names
      const setupPromises = [];
      for (let i = 0; i < 30; i++) {
        setupPromises.push(
          request(app.getHttpServer())
            .post('/queue')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              name: i % 3 === 0 ? `John Patient ${i}` : `Other Patient ${i}`,
              contactInfo: `${i}23-456-7890`,
            })
        );
      }
      
      await Promise.all(setupPromises);
      
      // Test search performance
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/queue?search=John')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.body.length).toBeGreaterThan(0);
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('Memory and Resource Tests', () => {
    it('should not have memory leaks during repeated operations', async () => {
      const iterations = 100;
      const initialMemory = process.memoryUsage();
      
      for (let i = 0; i < iterations; i++) {
        await request(app.getHttpServer())
          .get('/queue')
          .set('Authorization', `Bearer ${authToken}`);
        
        // Occasional garbage collection hint
        if (i % 20 === 0 && global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;
      
      // Memory increase should be reasonable (less than 50%)
      expect(memoryIncreasePercent).toBeLessThan(50);
    });

    it('should handle database connection pooling efficiently', async () => {
      const promises = [];
      
      // Create many concurrent database operations
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app.getHttpServer())
            .get('/queue')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should complete efficiently
      expect(totalTime).toBeLessThan(15000);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle invalid requests efficiently', async () => {
      const promises = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/queue')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              // Missing required name field
              contactInfo: '123-456-7890',
            })
        );
      }
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All should return 400 (validation error)
      responses.forEach(response => {
        expect(response.status).toBe(400);
      });
      
      // Should handle errors quickly
      expect(totalTime).toBeLessThan(5000);
    });

    it('should handle authentication errors efficiently', async () => {
      const promises = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app.getHttpServer())
            .get('/queue')
            // No authorization header
        );
      }
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All should return 401 (unauthorized)
      responses.forEach(response => {
        expect(response.status).toBe(401);
      });
      
      // Should handle auth errors quickly
      expect(totalTime).toBeLessThan(3000);
    });
  });
});