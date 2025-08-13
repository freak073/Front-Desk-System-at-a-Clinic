import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueueEntry } from '../../src/entities/queue-entry.entity';
import { Patient } from '../../src/entities/patient.entity';
import { User } from '../../src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Queue Management Integration Tests', () => {
  let app: INestApplication;
  let queueRepository: Repository<QueueEntry>;
  let patientRepository: Repository<Patient>;
  let userRepository: Repository<User>;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    queueRepository = moduleFixture.get<Repository<QueueEntry>>(getRepositoryToken(QueueEntry));
    patientRepository = moduleFixture.get<Repository<Patient>>(getRepositoryToken(Patient));
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

  beforeEach(async () => {
    // Clean up database
    await queueRepository.clear();
    await patientRepository.clear();
  });

  afterAll(async () => {
    await queueRepository.clear();
    await patientRepository.clear();
    await userRepository.clear();
    await app.close();
  });

  describe('POST /queue', () => {
    it('should add patient to queue', async () => {
      const response = await request(app.getHttpServer())
        .post('/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Doe',
          contactInfo: '123-456-7890',
          priority: 'normal',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.queueNumber).toBe(1);
      expect(response.body.patient.name).toBe('John Doe');
      expect(response.body.status).toBe('waiting');
      expect(response.body.priority).toBe('normal');
    });

    it('should auto-increment queue numbers', async () => {
      // Add first patient
      const response1 = await request(app.getHttpServer())
        .post('/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Doe',
          contactInfo: '123-456-7890',
        });

      // Add second patient
      const response2 = await request(app.getHttpServer())
        .post('/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Jane Smith',
          contactInfo: '098-765-4321',
        });

      expect(response1.body.queueNumber).toBe(1);
      expect(response2.body.queueNumber).toBe(2);
    });

    it('should handle urgent priority correctly', async () => {
      // Add normal priority patient
      await request(app.getHttpServer())
        .post('/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Normal Patient',
          contactInfo: '111-111-1111',
          priority: 'normal',
        });

      // Add urgent priority patient
      const response = await request(app.getHttpServer())
        .post('/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Urgent Patient',
          contactInfo: '222-222-2222',
          priority: 'urgent',
        })
        .expect(201);

      expect(response.body.priority).toBe('urgent');
      // Urgent patients should get lower queue numbers (higher priority)
      expect(response.body.queueNumber).toBeLessThan(2);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contactInfo: '123-456-7890',
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/queue')
        .send({
          name: 'John Doe',
          contactInfo: '123-456-7890',
        })
        .expect(401);
    });

    it('should respond within 2 seconds', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .post('/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Speed Test Patient',
          contactInfo: '123-456-7890',
        })
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(2000);
    });
  });

  describe('GET /queue', () => {
    beforeEach(async () => {
      // Create test patients in queue
      const patient1 = patientRepository.create({
        name: 'John Doe',
        contactInfo: '123-456-7890',
      });
      await patientRepository.save(patient1);

      const patient2 = patientRepository.create({
        name: 'Jane Smith',
        contactInfo: '098-765-4321',
      });
      await patientRepository.save(patient2);

      const queueEntry1 = queueRepository.create({
        patient: patient1,
        queueNumber: 1,
        status: 'waiting',
        priority: 'normal',
        estimatedWaitTime: 15,
      });
      await queueRepository.save(queueEntry1);

      const queueEntry2 = queueRepository.create({
        patient: patient2,
        queueNumber: 2,
        status: 'with_doctor',
        priority: 'urgent',
        estimatedWaitTime: 5,
      });
      await queueRepository.save(queueEntry2);
    });

    it('should return all queue entries', async () => {
      const response = await request(app.getHttpServer())
        .get('/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].patient.name).toBe('John Doe');
      expect(response.body[1].patient.name).toBe('Jane Smith');
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/queue?status=waiting')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('waiting');
    });

    it('should search by patient name', async () => {
      const response = await request(app.getHttpServer())
        .get('/queue?search=John')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].patient.name).toBe('John Doe');
    });

    it('should sort by queue number', async () => {
      const response = await request(app.getHttpServer())
        .get('/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body[0].queueNumber).toBeLessThan(response.body[1].queueNumber);
    });

    it('should include estimated wait times', async () => {
      const response = await request(app.getHttpServer())
        .get('/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body[0]).toHaveProperty('estimatedWaitTime');
      expect(response.body[1]).toHaveProperty('estimatedWaitTime');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/queue')
        .expect(401);
    });
  });

  describe('PUT /queue/:id/status', () => {
    let queueEntryId: number;

    beforeEach(async () => {
      const patient = patientRepository.create({
        name: 'Test Patient',
        contactInfo: '123-456-7890',
      });
      await patientRepository.save(patient);

      const queueEntry = queueRepository.create({
        patient: patient,
        queueNumber: 1,
        status: 'waiting',
        priority: 'normal',
      });
      const savedEntry = await queueRepository.save(queueEntry);
      queueEntryId = savedEntry.id;
    });

    it('should update patient status', async () => {
      const response = await request(app.getHttpServer())
        .put(`/queue/${queueEntryId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'with_doctor',
        })
        .expect(200);

      expect(response.body.status).toBe('with_doctor');
    });

    it('should validate status values', async () => {
      await request(app.getHttpServer())
        .put(`/queue/${queueEntryId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'invalid_status',
        })
        .expect(400);
    });

    it('should handle non-existent queue entry', async () => {
      await request(app.getHttpServer())
        .put('/queue/999/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'with_doctor',
        })
        .expect(404);
    });

    it('should update estimated wait time when status changes', async () => {
      const response = await request(app.getHttpServer())
        .put(`/queue/${queueEntryId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'with_doctor',
        })
        .expect(200);

      expect(response.body).toHaveProperty('estimatedWaitTime');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/queue/${queueEntryId}/status`)
        .send({
          status: 'with_doctor',
        })
        .expect(401);
    });
  });

  describe('DELETE /queue/:id', () => {
    let queueEntryId: number;

    beforeEach(async () => {
      const patient = patientRepository.create({
        name: 'Test Patient',
        contactInfo: '123-456-7890',
      });
      await patientRepository.save(patient);

      const queueEntry = queueRepository.create({
        patient: patient,
        queueNumber: 1,
        status: 'waiting',
        priority: 'normal',
      });
      const savedEntry = await queueRepository.save(queueEntry);
      queueEntryId = savedEntry.id;
    });

    it('should remove patient from queue', async () => {
      await request(app.getHttpServer())
        .delete(`/queue/${queueEntryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify patient is removed
      const response = await request(app.getHttpServer())
        .get('/queue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body).toHaveLength(0);
    });

    it('should handle non-existent queue entry', async () => {
      await request(app.getHttpServer())
        .delete('/queue/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/queue/${queueEntryId}`)
        .expect(401);
    });
  });

  describe('Queue Statistics', () => {
    beforeEach(async () => {
      // Create multiple patients with different statuses
      const patients = [];
      for (let i = 1; i <= 5; i++) {
        const patient = patientRepository.create({
          name: `Patient ${i}`,
          contactInfo: `${i}23-456-7890`,
        });
        patients.push(await patientRepository.save(patient));
      }

      const statuses = ['waiting', 'waiting', 'with_doctor', 'completed', 'waiting'];
      for (let i = 0; i < patients.length; i++) {
        const queueEntry = queueRepository.create({
          patient: patients[i],
          queueNumber: i + 1,
          status: statuses[i],
          priority: i === 0 ? 'urgent' : 'normal',
        });
        await queueRepository.save(queueEntry);
      }
    });

    it('should return queue statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/queue/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('waiting');
      expect(response.body).toHaveProperty('withDoctor');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('urgent');

      expect(response.body.total).toBe(5);
      expect(response.body.waiting).toBe(3);
      expect(response.body.withDoctor).toBe(1);
      expect(response.body.completed).toBe(1);
      expect(response.body.urgent).toBe(1);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent queue additions', async () => {
      const promises = [];
      
      for (let i = 1; i <= 5; i++) {
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
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('queueNumber');
      });

      // Queue numbers should be unique
      const queueNumbers = responses.map(r => r.body.queueNumber);
      const uniqueNumbers = [...new Set(queueNumbers)];
      expect(uniqueNumbers.length).toBe(queueNumbers.length);
    });

    it('should handle concurrent status updates', async () => {
      // Create a patient first
      const createResponse = await request(app.getHttpServer())
        .post('/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Concurrent Test Patient',
          contactInfo: '123-456-7890',
        });

      const queueEntryId = createResponse.body.id;

      // Try concurrent status updates
      const promises = [
        request(app.getHttpServer())
          .put(`/queue/${queueEntryId}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status: 'with_doctor' }),
        request(app.getHttpServer())
          .put(`/queue/${queueEntryId}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status: 'completed' }),
      ];

      const responses = await Promise.all(promises);
      
      // At least one should succeed
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });
  });
});