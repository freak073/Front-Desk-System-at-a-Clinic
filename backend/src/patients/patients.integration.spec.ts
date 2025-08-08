import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Patient } from '../entities/patient.entity';

describe('PatientsController (Integration)', () => {
  let app: INestApplication;
  let patientsService: PatientsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    patientsService = moduleFixture.get<PatientsService>(PatientsService);
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  describe('POST /patients', () => {
    it('should create a new patient', async () => {
      const createPatientDto = {
        name: 'John Doe',
        contactInfo: 'john@example.com',
        medicalRecordNumber: 'MRN-001',
      };

      const mockPatient = {
        id: 1,
        ...createPatientDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockPatient);
      mockRepository.save.mockResolvedValue(mockPatient);

      const response = await request(app.getHttpServer())
        .post('/patients')
        .send(createPatientDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: createPatientDto.name,
        contactInfo: createPatientDto.contactInfo,
        medicalRecordNumber: createPatientDto.medicalRecordNumber,
      });
      expect(response.body.id).toBeDefined();
    });

    it('should create a patient without medical record number', async () => {
      const createPatientDto = {
        name: 'Jane Doe',
        contactInfo: 'jane@example.com',
      };

      const mockPatient = {
        id: 2,
        ...createPatientDto,
        medicalRecordNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockPatient);
      mockRepository.save.mockResolvedValue(mockPatient);

      const response = await request(app.getHttpServer())
        .post('/patients')
        .send(createPatientDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: createPatientDto.name,
        contactInfo: createPatientDto.contactInfo,
      });
    });

    it('should return 400 for invalid data', async () => {
      const invalidPatientDto = {
        name: '', // Empty name should fail validation
        contactInfo: 'a'.repeat(256), // Too long contact info
      };

      await request(app.getHttpServer())
        .post('/patients')
        .send(invalidPatientDto)
        .expect(400);
    });

    it('should return 409 for duplicate medical record number', async () => {
      const duplicatePatientDto = {
        name: 'Jane Doe',
        contactInfo: 'jane@example.com',
        medicalRecordNumber: 'MRN-001',
      };

      const existingPatient = {
        id: 1,
        name: 'John Doe',
        medicalRecordNumber: 'MRN-001',
      };

      mockRepository.findOne.mockResolvedValue(existingPatient);

      await request(app.getHttpServer())
        .post('/patients')
        .send(duplicatePatientDto)
        .expect(409);
    });

    it('should validate medical record number format', async () => {
      const invalidMRNDto = {
        name: 'John Doe',
        contactInfo: 'john@example.com',
        medicalRecordNumber: 'invalid-mrn-format!', // Contains invalid characters
      };

      await request(app.getHttpServer())
        .post('/patients')
        .send(invalidMRNDto)
        .expect(400);
    });
  });

  describe('GET /patients', () => {
    it('should return all patients', async () => {
      const mockPatients = [
        {
          id: 1,
          name: 'Bob Johnson',
          contactInfo: 'bob@example.com',
          medicalRecordNumber: null,
        },
        {
          id: 2,
          name: 'Jane Smith',
          contactInfo: 'jane@example.com',
          medicalRecordNumber: 'MRN-002',
        },
        {
          id: 3,
          name: 'John Doe',
          contactInfo: 'john@example.com',
          medicalRecordNumber: 'MRN-001',
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockPatients);

      const response = await request(app.getHttpServer())
        .get('/patients')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].name).toBe('Bob Johnson');
      expect(response.body[1].name).toBe('Jane Smith');
      expect(response.body[2].name).toBe('John Doe');
    });

    it('should filter patients by search term', async () => {
      const mockFilteredPatients = [
        {
          id: 1,
          name: 'John Doe',
          contactInfo: 'john@example.com',
          medicalRecordNumber: 'MRN-001',
        },
        {
          id: 2,
          name: 'Bob Johnson',
          contactInfo: 'bob@example.com',
          medicalRecordNumber: null,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockFilteredPatients);

      const response = await request(app.getHttpServer())
        .get('/patients?search=John')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.some(p => p.name === 'John Doe')).toBe(true);
      expect(response.body.some(p => p.name === 'Bob Johnson')).toBe(true);
    });

    it('should filter patients by name', async () => {
      const mockFilteredPatients = [
        {
          id: 1,
          name: 'Jane Smith',
          contactInfo: 'jane@example.com',
          medicalRecordNumber: 'MRN-002',
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockFilteredPatients);

      const response = await request(app.getHttpServer())
        .get('/patients?name=Jane')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Jane Smith');
    });

    it('should filter patients by medical record number', async () => {
      const mockFilteredPatients = [
        {
          id: 1,
          name: 'John Doe',
          contactInfo: 'john@example.com',
          medicalRecordNumber: 'MRN-001',
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockFilteredPatients);

      const response = await request(app.getHttpServer())
        .get('/patients?medicalRecordNumber=MRN-001')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].medicalRecordNumber).toBe('MRN-001');
    });
  });

  describe('GET /patients/search', () => {
    it('should return search results', async () => {
      const mockSearchResults = [
        {
          id: 1,
          name: 'John Doe',
          contactInfo: 'john@example.com',
          medicalRecordNumber: 'MRN-001',
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockSearchResults);

      const response = await request(app.getHttpServer())
        .get('/patients/search?q=John')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('John Doe');
    });

    it('should return empty array for no matches', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/patients/search?q=NonExistent')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /patients/:id', () => {
    it('should return a patient by id', async () => {
      const mockPatient = {
        id: 1,
        name: 'John Doe',
        contactInfo: 'john@example.com',
        medicalRecordNumber: 'MRN-001',
      };

      mockRepository.findOne.mockResolvedValue(mockPatient);

      const response = await request(app.getHttpServer())
        .get('/patients/1')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        name: 'John Doe',
        contactInfo: 'john@example.com',
        medicalRecordNumber: 'MRN-001',
      });
    });

    it('should return 404 for non-existent patient', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/patients/999')
        .expect(404);
    });

    it('should return 400 for invalid id format', async () => {
      await request(app.getHttpServer())
        .get('/patients/invalid-id')
        .expect(400);
    });
  });

  describe('PATCH /patients/:id', () => {
    it('should update a patient', async () => {
      const mockPatient = {
        id: 1,
        name: 'John Doe',
        contactInfo: 'john@example.com',
        medicalRecordNumber: 'MRN-001',
      };

      const updatedPatient = {
        ...mockPatient,
        name: 'John Updated',
        contactInfo: 'john.updated@example.com',
      };

      mockRepository.findOne.mockResolvedValue(mockPatient);
      mockRepository.save.mockResolvedValue(updatedPatient);

      const updateDto = {
        name: 'John Updated',
        contactInfo: 'john.updated@example.com',
      };

      const response = await request(app.getHttpServer())
        .patch('/patients/1')
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        name: 'John Updated',
        contactInfo: 'john.updated@example.com',
        medicalRecordNumber: 'MRN-001',
      });
    });

    it('should return 404 for non-existent patient', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const updateDto = { name: 'Updated Name' };

      await request(app.getHttpServer())
        .patch('/patients/999')
        .send(updateDto)
        .expect(404);
    });
  });

  describe('DELETE /patients/:id', () => {
    it('should delete a patient', async () => {
      const mockPatient = {
        id: 1,
        name: 'John Doe',
        contactInfo: 'john@example.com',
        medicalRecordNumber: 'MRN-001',
      };

      mockRepository.findOne.mockResolvedValue(mockPatient);
      mockRepository.remove.mockResolvedValue(mockPatient);

      await request(app.getHttpServer())
        .delete('/patients/1')
        .expect(204);
    });

    it('should return 404 for non-existent patient', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/patients/999')
        .expect(404);
    });
  });
});