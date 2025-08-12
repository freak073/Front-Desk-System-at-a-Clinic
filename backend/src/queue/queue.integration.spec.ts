import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { QueueController } from "./queue.controller";
import { QueueService } from "./queue.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { QueueEntry } from "../entities/queue-entry.entity";
import { Patient } from "../entities/patient.entity";

interface ApiEnvelope<T, M = any> {
  success: boolean;
  data: T;
  meta?: M;
  message?: string;
}
interface QueueEntryDto {
  id: number;
  patientId: number;
  queueNumber: number;
  status: string;
  priority: string;
  patient?: { name: string };
}

describe("QueueController (Integration)", () => {
  let app: INestApplication;
  let queueService: QueueService;

  const mockQueueRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPatientRepository = {
    findOne: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [
        QueueService,
        {
          provide: getRepositoryToken(QueueEntry),
          useValue: mockQueueRepository,
        },
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    mockQueueRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockQueueRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  describe("POST /queue", () => {
    it("should add patient to queue", async () => {
      const createQueueEntryDto = {
        patientId: 1,
        priority: "normal",
      };

      const mockPatient = {
        id: 1,
        name: "John Doe",
        contactInfo: "john@example.com",
        medicalRecordNumber: "MRN-001",
      };

      const mockQueueEntry = {
        id: 1,
        patientId: 1,
        queueNumber: 1,
        status: "waiting",
        priority: "normal",
        arrivalTime: new Date(),
        estimatedWaitTime: 0,
        patient: mockPatient,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      mockQueueRepository.findOne
        .mockResolvedValueOnce(null) // No existing entry
        .mockResolvedValueOnce(mockQueueEntry); // Return created entry in findOne after save
      mockQueueRepository.create.mockReturnValue(mockQueueEntry);
      mockQueueRepository.save.mockResolvedValue(mockQueueEntry);
      mockQueueRepository.find.mockResolvedValue([]); // For updateEstimatedWaitTimes
      mockQueryBuilder.getOne.mockResolvedValue(null); // For generateNextQueueNumber

      const response = await request(app.getHttpServer())
        .post("/queue")
        .send(createQueueEntryDto)
        .expect(201);

      const body = response.body as ApiEnvelope<QueueEntryDto>;
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        patientId: createQueueEntryDto.patientId,
        priority: createQueueEntryDto.priority,
        status: "waiting",
        queueNumber: 1,
      });
      expect(body.data.id).toBeDefined();
    });

    it("should return 400 for invalid data", async () => {
      const invalidDto = {
        patientId: "invalid", // Should be number
        priority: "invalid", // Should be 'normal' or 'urgent'
      };

      await request(app.getHttpServer())
        .post("/queue")
        .send(invalidDto)
        .expect(400);
    });

    it("should return 404 for non-existent patient", async () => {
      const createQueueEntryDto = {
        patientId: 999,
        priority: "normal",
      };

      mockPatientRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post("/queue")
        .send(createQueueEntryDto)
        .expect(404);
    });

    it("should return 409 for patient already in queue", async () => {
      const createQueueEntryDto = {
        patientId: 1,
        priority: "normal",
      };

      const mockPatient = {
        id: 1,
        name: "John Doe",
      };

      const existingQueueEntry = {
        id: 1,
        patientId: 1,
        status: "waiting",
      };

      mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      mockQueueRepository.findOne.mockResolvedValue(existingQueueEntry);

      await request(app.getHttpServer())
        .post("/queue")
        .send(createQueueEntryDto)
        .expect(409);
    });
  });

  describe("GET /queue", () => {
    it("should return all queue entries", async () => {
      const mockQueueEntries = [
        {
          id: 1,
          patientId: 1,
          queueNumber: 1,
          status: "waiting",
          priority: "urgent",
          patient: { name: "John Doe" },
        },
        {
          id: 2,
          patientId: 2,
          queueNumber: 2,
          status: "waiting",
          priority: "normal",
          patient: { name: "Jane Smith" },
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockQueueEntries);
      mockQueryBuilder.getCount.mockResolvedValue(2);

      const response = await request(app.getHttpServer())
        .get("/queue")
        .expect(200);

      const body = response.body as ApiEnvelope<
        QueueEntryDto[],
        { total: number }
      >;
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.meta?.total).toBe(2);
      expect(body.data[0].priority).toBe("urgent");
      expect(body.data[1].priority).toBe("normal");
    });

    it("should filter queue entries by status", async () => {
      const mockFilteredEntries = [
        {
          id: 1,
          patientId: 1,
          queueNumber: 1,
          status: "waiting",
          priority: "normal",
          patient: { name: "John Doe" },
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockFilteredEntries);
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .get("/queue?status=waiting")
        .expect(200);

      const body = response.body as ApiEnvelope<
        QueueEntryDto[],
        { total: number }
      >;
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.meta?.total).toBe(1);
      expect(body.data[0].status).toBe("waiting");
    });

    it("should filter queue entries by priority", async () => {
      const mockFilteredEntries = [
        {
          id: 1,
          patientId: 1,
          queueNumber: 1,
          status: "waiting",
          priority: "urgent",
          patient: { name: "John Doe" },
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockFilteredEntries);
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .get("/queue?priority=urgent")
        .expect(200);

      const body = response.body as ApiEnvelope<
        QueueEntryDto[],
        { total: number }
      >;
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.meta?.total).toBe(1);
      expect(body.data[0].priority).toBe("urgent");
    });

    it("should search queue entries by patient information", async () => {
      const mockSearchResults = [
        {
          id: 1,
          patientId: 1,
          queueNumber: 1,
          status: "waiting",
          priority: "normal",
          patient: { name: "John Doe" },
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockSearchResults);
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .get("/queue?search=John")
        .expect(200);

      const body = response.body as ApiEnvelope<
        QueueEntryDto[],
        { total: number }
      >;
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.meta?.total).toBe(1);
      expect(body.data[0].patient?.name).toBe("John Doe");
    });
  });

  describe("GET /queue/current", () => {
    it("should return current waiting queue", async () => {
      const mockCurrentQueue = [
        {
          id: 1,
          status: "waiting",
          priority: "urgent",
          queueNumber: 1,
          patient: { name: "John Doe" },
        },
        {
          id: 2,
          status: "waiting",
          priority: "normal",
          queueNumber: 2,
          patient: { name: "Jane Smith" },
        },
      ];

      mockQueueRepository.find.mockResolvedValue(mockCurrentQueue);

      const response = await request(app.getHttpServer())
        .get("/queue/current")
        .expect(200);

      const body = response.body as ApiEnvelope<
        QueueEntryDto[],
        { total: number }
      >;
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.meta?.total).toBe(2);
      expect(body.data[0].priority).toBe("urgent");
      expect(body.data[1].priority).toBe("normal");
    });
  });

  describe("GET /queue/stats", () => {
    it("should return queue statistics", async () => {
      mockQueueRepository.count
        .mockResolvedValueOnce(5) // totalWaiting
        .mockResolvedValueOnce(2) // totalWithDoctor
        .mockResolvedValueOnce(10) // totalCompleted
        .mockResolvedValueOnce(1); // urgentWaiting

      mockQueryBuilder.getMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get("/queue/stats")
        .expect(200);

      const body = response.body as ApiEnvelope<{
        totalWaiting: number;
        totalWithDoctor: number;
        totalCompleted: number;
        urgentWaiting: number;
        averageWaitTime: number;
      }>;
      expect(body.success).toBe(true);
      expect(body.data).toEqual({
        totalWaiting: 5,
        totalWithDoctor: 2,
        totalCompleted: 10,
        urgentWaiting: 1,
        averageWaitTime: 0,
      });
    });
  });

  describe("GET /queue/search", () => {
    it("should return search results", async () => {
      const mockSearchResults = [
        {
          id: 1,
          patient: { name: "John Doe" },
          priority: "normal",
          queueNumber: 1,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockSearchResults);

      const response = await request(app.getHttpServer())
        .get("/queue/search?q=John")
        .expect(200);

      const body = response.body as ApiEnvelope<
        QueueEntryDto[],
        { total: number }
      >;
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.meta?.total).toBe(1);
      expect(body.data[0].patient?.name).toBe("John Doe");
    });

    it("should return empty array for no matches", async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get("/queue/search?q=NonExistent")
        .expect(200);

      const body = response.body as ApiEnvelope<
        QueueEntryDto[],
        { total: number }
      >;
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(0);
      expect(body.meta?.total).toBe(0);
    });
  });

  describe("GET /queue/:id", () => {
    it("should return queue entry by id", async () => {
      const mockQueueEntry = {
        id: 1,
        patientId: 1,
        queueNumber: 1,
        status: "waiting",
        priority: "normal",
        patient: { name: "John Doe" },
      };

      mockQueueRepository.findOne.mockResolvedValue(mockQueueEntry);

      const response = await request(app.getHttpServer())
        .get("/queue/1")
        .expect(200);

      const body = response.body as ApiEnvelope<QueueEntryDto>;
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: 1,
        patientId: 1,
        queueNumber: 1,
        status: "waiting",
        priority: "normal",
      });
    });

    it("should return 404 for non-existent queue entry", async () => {
      mockQueueRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer()).get("/queue/999").expect(404);
    });

    it("should return 400 for invalid id format", async () => {
      await request(app.getHttpServer()).get("/queue/invalid-id").expect(400);
    });
  });

  describe("GET /queue/number/:queueNumber", () => {
    it("should return queue entry by queue number", async () => {
      const mockQueueEntry = {
        id: 1,
        patientId: 1,
        queueNumber: 1,
        status: "waiting",
        priority: "normal",
        patient: { name: "John Doe" },
      };

      mockQueueRepository.findOne.mockResolvedValue(mockQueueEntry);

      const response = await request(app.getHttpServer())
        .get("/queue/number/1")
        .expect(200);

      const body = response.body as ApiEnvelope<QueueEntryDto>;
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: 1,
        queueNumber: 1,
        status: "waiting",
      });
    });

    it("should return 404 for non-existent queue number", async () => {
      mockQueueRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer()).get("/queue/number/999").expect(404);
    });
  });

  describe("PATCH /queue/:id", () => {
    it("should update queue entry status", async () => {
      const mockQueueEntry = {
        id: 1,
        patientId: 1,
        queueNumber: 1,
        status: "waiting",
        priority: "normal",
        patient: { name: "John Doe" },
      };

      const updatedEntry = {
        ...mockQueueEntry,
        status: "with_doctor",
      };

      mockQueueRepository.findOne
        .mockResolvedValueOnce(mockQueueEntry) // findOne call
        .mockResolvedValueOnce(updatedEntry); // findOne call after save
      mockQueueRepository.save.mockResolvedValue(updatedEntry);
      mockQueueRepository.find.mockResolvedValue([]); // For updateEstimatedWaitTimes

      const updateDto = { status: "with_doctor" };

      const response = await request(app.getHttpServer())
        .patch("/queue/1")
        .send(updateDto)
        .expect(200);

      const body = response.body as ApiEnvelope<QueueEntryDto>;
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: 1,
        status: "with_doctor",
      });
    });

    it("should return 404 for non-existent queue entry", async () => {
      mockQueueRepository.findOne.mockResolvedValue(null);

      const updateDto = { status: "with_doctor" };

      await request(app.getHttpServer())
        .patch("/queue/999")
        .send(updateDto)
        .expect(404);
    });
  });

  describe("DELETE /queue/:id", () => {
    it("should remove queue entry", async () => {
      const mockQueueEntry = {
        id: 1,
        patientId: 1,
        queueNumber: 1,
        status: "waiting",
        priority: "normal",
        patient: { name: "John Doe" },
      };

      mockQueueRepository.findOne.mockResolvedValue(mockQueueEntry);
      mockQueueRepository.remove.mockResolvedValue(mockQueueEntry);
      mockQueueRepository.find.mockResolvedValue([]); // For updateEstimatedWaitTimes

      await request(app.getHttpServer()).delete("/queue/1").expect(204);
    });

    it("should return 404 for non-existent queue entry", async () => {
      mockQueueRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer()).delete("/queue/999").expect(404);
    });
  });
});
