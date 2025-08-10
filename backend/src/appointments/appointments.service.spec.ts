import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { Appointment } from "../entities/appointment.entity";
import { Doctor } from "../entities/doctor.entity";
import { Patient } from "../entities/patient.entity";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { CacheService } from "../services/cache.service";

describe("AppointmentsService", () => {
  let service: AppointmentsService;

  const mockAppointmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDoctorRepository = {
    findOne: jest.fn(),
  };

  const mockPatientRepository = {
    findOne: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockCacheService: Partial<CacheService> = {
    generateKey: jest.fn((prefix: string) => prefix),
    wrap: jest.fn(async (_opts: any, fn: any) => await fn()),
    clear: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentRepository,
        },
        {
          provide: getRepositoryToken(Doctor),
          useValue: mockDoctorRepository,
        },
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        }
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  // Use mock repositories directly in tests
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createAppointmentDto: CreateAppointmentDto = {
      patientId: 1,
      doctorId: 1,
      appointmentDatetime: new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString(), // Tomorrow
      notes: "Regular checkup",
    };

    const mockPatient = { id: 1, name: "John Doe" };
    const mockDoctor = { id: 1, name: "Dr. Smith" };
    const mockAppointment = { id: 1, ...createAppointmentDto };

    it("should create an appointment successfully", async () => {
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);
      mockAppointmentRepository.findOne.mockResolvedValue(null); // No existing appointment
      mockAppointmentRepository.create.mockReturnValue(mockAppointment);
      mockAppointmentRepository.save.mockResolvedValue(mockAppointment);

      const result = await service.create(createAppointmentDto);

      expect(result).toEqual(mockAppointment);
      expect(mockPatientRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockDoctorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockAppointmentRepository.create).toHaveBeenCalled();
      expect(mockAppointmentRepository.save).toHaveBeenCalled();
    });

    it("should throw NotFoundException if patient does not exist", async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createAppointmentDto)).rejects.toThrow(
        new NotFoundException("Patient with ID 1 not found"),
      );
    });

    it("should throw NotFoundException if doctor does not exist", async () => {
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      mockDoctorRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createAppointmentDto)).rejects.toThrow(
        new NotFoundException("Doctor with ID 1 not found"),
      );
    });

    it("should throw BadRequestException if appointment time is in the past", async () => {
      const pastAppointmentDto = {
        ...createAppointmentDto,
        appointmentDatetime: new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        ).toISOString(), // Yesterday
      };

      mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);

      await expect(service.create(pastAppointmentDto)).rejects.toThrow(
        new BadRequestException("Appointment time must be in the future"),
      );
    });

    it("should throw ConflictException if doctor is not available", async () => {
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);
      mockAppointmentRepository.findOne.mockResolvedValue(mockAppointment); // Existing appointment

      await expect(service.create(createAppointmentDto)).rejects.toThrow(
        new ConflictException("Doctor is not available at the requested time"),
      );
    });
  });

  describe("findAll", () => {
    const mockAppointments = [
      { id: 1, patientId: 1, doctorId: 1, status: "booked" },
      { id: 2, patientId: 2, doctorId: 1, status: "completed" },
    ];

    beforeEach(() => {
      mockAppointmentRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
    });

    it("should return paginated appointments", async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockAppointments, 2]);

      const query = { page: 1, limit: 10 };
      const result = await service.findAll(query);

      expect(result).toEqual({
        appointments: mockAppointments,
        total: 2,
        totalPages: 1,
      });
      expect(mockAppointmentRepository.createQueryBuilder).toHaveBeenCalledWith(
        "appointment",
      );
    });

    it("should apply filters correctly", async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const query = {
        patientName: "John",
        doctorId: 1,
        status: "booked",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        page: 1,
        limit: 10,
      };

      await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "patient.name LIKE :patientName",
        {
          patientName: "%John%",
        },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "appointment.doctorId = :doctorId",
        {
          doctorId: 1,
        },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "appointment.status = :status",
        {
          status: "booked",
        },
      );
    });
  });

  describe("findOne", () => {
    const mockAppointment = { id: 1, patientId: 1, doctorId: 1 };

    it("should return an appointment by id", async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(mockAppointment);

      const result = await service.findOne(1);

      expect(result).toEqual(mockAppointment);
      expect(mockAppointmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["patient", "doctor"],
      });
    });

    it("should throw NotFoundException if appointment does not exist", async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(
        new NotFoundException("Appointment with ID 1 not found"),
      );
    });
  });

  describe("getAvailableSlots", () => {
    const mockDoctor = { id: 1, name: "Dr. Smith" };
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = tomorrow.toISOString().split("T")[0];

    it("should return available time slots", async () => {
      mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);
      mockAppointmentRepository.find.mockResolvedValue([]); // No existing appointments

      const result = await service.getAvailableSlots(1, targetDate);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(mockDoctorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should throw NotFoundException if doctor does not exist", async () => {
      mockDoctorRepository.findOne.mockResolvedValue(null);

      await expect(service.getAvailableSlots(1, targetDate)).rejects.toThrow(
        new NotFoundException("Doctor with ID 1 not found"),
      );
    });
  });

  describe("getStatusStatistics", () => {
    it("should return appointment status statistics", async () => {
      const mockStatistics = [
        { status: "booked", count: "5" },
        { status: "completed", count: "10" },
        { status: "canceled", count: "2" },
      ];

      mockAppointmentRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getRawMany.mockResolvedValue(mockStatistics);

      const result = await service.getStatusStatistics();

      expect(result).toEqual([
        { status: "booked", count: 5 },
        { status: "completed", count: 10 },
        { status: "canceled", count: 2 },
      ]);
    });
  });

  describe("getTodaysAppointments", () => {
    it("should return today's appointments", async () => {
      const mockAppointments = [
        { id: 1, appointmentDatetime: new Date() },
        { id: 2, appointmentDatetime: new Date() },
      ];

      mockAppointmentRepository.find.mockResolvedValue(mockAppointments);

      const result = await service.getTodaysAppointments();

      expect(result).toEqual(mockAppointments);
      expect(mockAppointmentRepository.find).toHaveBeenCalledWith({
        where: {
          appointmentDatetime: expect.any(Object), // Between query
        },
        relations: ["patient", "doctor"],
        order: { appointmentDatetime: "ASC" },
      });
    });
  });

  describe("getUpcomingAppointments", () => {
    it("should return upcoming appointments", async () => {
      const mockAppointments = [
        {
          id: 1,
          appointmentDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        {
          id: 2,
          appointmentDatetime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      ];

      mockAppointmentRepository.find.mockResolvedValue(mockAppointments);

      const result = await service.getUpcomingAppointments(10);

      expect(result).toEqual(mockAppointments);
      expect(mockAppointmentRepository.find).toHaveBeenCalledWith({
        where: {
          appointmentDatetime: expect.any(Object), // MoreThan query
          status: "booked",
        },
        relations: ["patient", "doctor"],
        order: { appointmentDatetime: "ASC" },
        take: 10,
      });
    });
  });
});
