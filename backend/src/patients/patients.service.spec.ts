import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PatientsService } from "./patients.service";
import { Patient } from "../entities/patient.entity";
import { CreatePatientDto, UpdatePatientDto, PatientQueryDto } from "./dto";

describe("PatientsService", () => {
  let service: PatientsService;
  let repository: Repository<Patient>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    repository = module.get<Repository<Patient>>(getRepositoryToken(Patient));

    // Reset all mocks
    jest.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const createPatientDto: CreatePatientDto = {
      name: "John Doe",
      contactInfo: "john@example.com",
      medicalRecordNumber: "MRN-001",
    };

    const mockPatient = {
      id: 1,
      ...createPatientDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should create a patient successfully", async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockPatient);
      mockRepository.save.mockResolvedValue(mockPatient);

      const result = await service.create(createPatientDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { medicalRecordNumber: createPatientDto.medicalRecordNumber },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createPatientDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockPatient);
      expect(result).toEqual(mockPatient);
    });

    it("should throw ConflictException if medical record number already exists", async () => {
      mockRepository.findOne.mockResolvedValue(mockPatient);

      await expect(service.create(createPatientDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { medicalRecordNumber: createPatientDto.medicalRecordNumber },
      });
    });

    it("should create patient without medical record number", async () => {
      const createPatientDtoWithoutMRN = {
        name: "Jane Doe",
        contactInfo: "jane@example.com",
      };
      const mockPatientWithoutMRN = {
        id: 2,
        ...createPatientDtoWithoutMRN,
        medicalRecordNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockPatientWithoutMRN);
      mockRepository.save.mockResolvedValue(mockPatientWithoutMRN);

      const result = await service.create(createPatientDtoWithoutMRN);

      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockPatientWithoutMRN);
    });

    it("should throw BadRequestException on database error", async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockPatient);
      mockRepository.save.mockRejectedValue(new Error("Database error"));

      await expect(service.create(createPatientDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("findAll", () => {
    const mockPatients = [
      {
        id: 1,
        name: "John Doe",
        contactInfo: "john@example.com",
        medicalRecordNumber: "MRN-001",
      },
      {
        id: 2,
        name: "Jane Smith",
        contactInfo: "jane@example.com",
        medicalRecordNumber: "MRN-002",
      },
    ];

    it("should return all patients without query", async () => {
      mockQueryBuilder.getMany.mockResolvedValue(mockPatients);

      const result = await service.findAll();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith("patient");
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        "patient.name",
        "ASC",
      );
      expect(result).toEqual(mockPatients);
    });

    it("should filter patients by search term", async () => {
      const query: PatientQueryDto = { search: "John" };
      mockQueryBuilder.getMany.mockResolvedValue([mockPatients[0]]);

      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "(patient.name LIKE :search OR patient.contactInfo LIKE :search OR patient.medicalRecordNumber LIKE :search)",
        { search: "%John%" },
      );
      expect(result).toEqual([mockPatients[0]]);
    });

    it("should filter patients by name", async () => {
      const query: PatientQueryDto = { name: "Doe" };
      mockQueryBuilder.getMany.mockResolvedValue([mockPatients[0]]);

      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "patient.name LIKE :name",
        {
          name: "%Doe%",
        },
      );
      expect(result).toEqual([mockPatients[0]]);
    });

    it("should filter patients by medical record number", async () => {
      const query: PatientQueryDto = { medicalRecordNumber: "MRN-001" };
      mockQueryBuilder.getMany.mockResolvedValue([mockPatients[0]]);

      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "patient.medicalRecordNumber = :medicalRecordNumber",
        { medicalRecordNumber: "MRN-001" },
      );
      expect(result).toEqual([mockPatients[0]]);
    });
  });

  describe("findOne", () => {
    const mockPatient = {
      id: 1,
      name: "John Doe",
      contactInfo: "john@example.com",
      medicalRecordNumber: "MRN-001",
    };

    it("should return a patient by id", async () => {
      mockRepository.findOne.mockResolvedValue(mockPatient);

      const result = await service.findOne(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockPatient);
    });

    it("should throw NotFoundException if patient not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe("findByMedicalRecordNumber", () => {
    const mockPatient = {
      id: 1,
      name: "John Doe",
      contactInfo: "john@example.com",
      medicalRecordNumber: "MRN-001",
    };

    it("should return a patient by medical record number", async () => {
      mockRepository.findOne.mockResolvedValue(mockPatient);

      const result = await service.findByMedicalRecordNumber("MRN-001");

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { medicalRecordNumber: "MRN-001" },
      });
      expect(result).toEqual(mockPatient);
    });

    it("should throw NotFoundException if patient not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findByMedicalRecordNumber("MRN-999"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    const mockPatient = {
      id: 1,
      name: "John Doe",
      contactInfo: "john@example.com",
      medicalRecordNumber: "MRN-001",
    };

    const updatePatientDto: UpdatePatientDto = {
      name: "John Updated",
      contactInfo: "john.updated@example.com",
    };

    it("should update a patient successfully", async () => {
      const updatedPatient = { ...mockPatient, ...updatePatientDto };
      mockRepository.findOne.mockResolvedValue(mockPatient);
      mockRepository.save.mockResolvedValue(updatedPatient);

      const result = await service.update(1, updatePatientDto);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedPatient);
      expect(result).toEqual(updatedPatient);
    });

    it("should throw ConflictException if medical record number already exists", async () => {
      const updateWithMRN: UpdatePatientDto = {
        medicalRecordNumber: "MRN-002",
      };
      const existingPatient = { id: 2, medicalRecordNumber: "MRN-002" };

      mockRepository.findOne
        .mockResolvedValueOnce(mockPatient) // First call for findOne(id)
        .mockResolvedValueOnce(existingPatient); // Second call for checking MRN uniqueness

      await expect(service.update(1, updateWithMRN)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should throw NotFoundException if patient not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updatePatientDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("remove", () => {
    const mockPatient = {
      id: 1,
      name: "John Doe",
      contactInfo: "john@example.com",
      medicalRecordNumber: "MRN-001",
    };

    it("should remove a patient successfully", async () => {
      mockRepository.findOne.mockResolvedValue(mockPatient);
      mockRepository.remove.mockResolvedValue(mockPatient);

      await service.remove(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockPatient);
    });

    it("should throw NotFoundException if patient not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("search", () => {
    const mockPatients = [
      {
        id: 1,
        name: "John Doe",
        contactInfo: "john@example.com",
        medicalRecordNumber: "MRN-001",
      },
    ];

    it("should return search results", async () => {
      mockQueryBuilder.getMany.mockResolvedValue(mockPatients);

      const result = await service.search("John");

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "(patient.name LIKE :search OR patient.contactInfo LIKE :search OR patient.medicalRecordNumber LIKE :search)",
        { search: "%John%" },
      );
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockPatients);
    });

    it("should return empty array for empty search term", async () => {
      const result = await service.search("");

      expect(result).toEqual([]);
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it("should return empty array for whitespace search term", async () => {
      const result = await service.search("   ");

      expect(result).toEqual([]);
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe("validateMedicalRecordNumber", () => {
    it("should return true if medical record number is unique", async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await service.validateMedicalRecordNumber("MRN-NEW");

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "patient.medicalRecordNumber = :medicalRecordNumber",
        { medicalRecordNumber: "MRN-NEW" },
      );
      expect(result).toBe(true);
    });

    it("should return false if medical record number already exists", async () => {
      const existingPatient = { id: 1, medicalRecordNumber: "MRN-001" };
      mockQueryBuilder.getOne.mockResolvedValue(existingPatient);

      const result = await service.validateMedicalRecordNumber("MRN-001");

      expect(result).toBe(false);
    });

    it("should exclude specific patient ID when validating", async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await service.validateMedicalRecordNumber("MRN-001", 1);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "patient.id != :excludeId",
        {
          excludeId: 1,
        },
      );
      expect(result).toBe(true);
    });
  });
});
