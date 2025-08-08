import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueEntry } from '../entities/queue-entry.entity';
import { Patient } from '../entities/patient.entity';
import { CreateQueueEntryDto, UpdateQueueEntryDto, QueueQueryDto } from './dto';

describe('QueueService', () => {
  let service: QueueService;
  let queueRepository: Repository<QueueEntry>;
  let patientRepository: Repository<Patient>;

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
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<QueueService>(QueueService);
    queueRepository = module.get<Repository<QueueEntry>>(getRepositoryToken(QueueEntry));
    patientRepository = module.get<Repository<Patient>>(getRepositoryToken(Patient));

    // Reset all mocks
    jest.clearAllMocks();
    mockQueueRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToQueue', () => {
    const createQueueEntryDto: CreateQueueEntryDto = {
      patientId: 1,
      priority: 'normal',
    };

    const mockPatient = {
      id: 1,
      name: 'John Doe',
      contactInfo: 'john@example.com',
      medicalRecordNumber: 'MRN-001',
    };

    const mockQueueEntry = {
      id: 1,
      patientId: 1,
      queueNumber: 1,
      status: 'waiting',
      priority: 'normal',
      arrivalTime: new Date(),
      estimatedWaitTime: 0,
      patient: mockPatient,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should add patient to queue successfully', async () => {
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      mockQueueRepository.findOne
        .mockResolvedValueOnce(null) // No existing entry check
        .mockResolvedValueOnce(mockQueueEntry); // Return created entry in findOne after save
      mockQueueRepository.create.mockReturnValue(mockQueueEntry);
      mockQueueRepository.save.mockResolvedValue(mockQueueEntry);
      mockQueueRepository.find.mockResolvedValue([]); // For updateEstimatedWaitTimes
      mockQueryBuilder.getOne.mockResolvedValue(null); // For generateNextQueueNumber

      const result = await service.addToQueue(createQueueEntryDto);

      expect(mockPatientRepository.findOne).toHaveBeenCalledWith({
        where: { id: createQueueEntryDto.patientId },
      });
      expect(mockQueueRepository.create).toHaveBeenCalled();
      expect(mockQueueRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockQueueEntry);
    });

    it('should throw NotFoundException if patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(service.addToQueue(createQueueEntryDto)).rejects.toThrow(NotFoundException);
      expect(mockPatientRepository.findOne).toHaveBeenCalledWith({
        where: { id: createQueueEntryDto.patientId },
      });
    });

    it('should throw ConflictException if patient is already in queue', async () => {
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      mockQueueRepository.findOne.mockResolvedValue(mockQueueEntry); // Existing entry

      await expect(service.addToQueue(createQueueEntryDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    const mockQueueEntries = [
      {
        id: 1,
        patientId: 1,
        queueNumber: 1,
        status: 'waiting',
        priority: 'urgent',
        patient: { name: 'John Doe' },
      },
      {
        id: 2,
        patientId: 2,
        queueNumber: 2,
        status: 'waiting',
        priority: 'normal',
        patient: { name: 'Jane Smith' },
      },
    ];

    it('should return all queue entries without query', async () => {
      mockQueryBuilder.getMany.mockResolvedValue(mockQueueEntries);

      const result = await service.findAll();

      expect(mockQueueRepository.createQueryBuilder).toHaveBeenCalledWith('queue');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('queue.patient', 'patient');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('queue.priority', 'DESC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('queue.queueNumber', 'ASC');
      expect(result).toEqual(mockQueueEntries);
    });

    it('should filter by status', async () => {
      const query: QueueQueryDto = { status: 'waiting' };
      mockQueryBuilder.getMany.mockResolvedValue([mockQueueEntries[0]]);

      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('queue.status = :status', {
        status: 'waiting',
      });
      expect(result).toEqual([mockQueueEntries[0]]);
    });

    it('should filter by priority', async () => {
      const query: QueueQueryDto = { priority: 'urgent' };
      mockQueryBuilder.getMany.mockResolvedValue([mockQueueEntries[0]]);

      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('queue.priority = :priority', {
        priority: 'urgent',
      });
      expect(result).toEqual([mockQueueEntries[0]]);
    });

    it('should search by patient information', async () => {
      const query: QueueQueryDto = { search: 'John' };
      mockQueryBuilder.getMany.mockResolvedValue([mockQueueEntries[0]]);

      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(patient.name LIKE :search OR patient.contactInfo LIKE :search OR patient.medicalRecordNumber LIKE :search)',
        { search: '%John%' },
      );
      expect(result).toEqual([mockQueueEntries[0]]);
    });
  });

  describe('findOne', () => {
    const mockQueueEntry = {
      id: 1,
      patientId: 1,
      queueNumber: 1,
      status: 'waiting',
      priority: 'normal',
      patient: { name: 'John Doe' },
    };

    it('should return queue entry by id', async () => {
      mockQueueRepository.findOne.mockResolvedValue(mockQueueEntry);

      const result = await service.findOne(1);

      expect(mockQueueRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['patient'],
      });
      expect(result).toEqual(mockQueueEntry);
    });

    it('should throw NotFoundException if queue entry not found', async () => {
      mockQueueRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByQueueNumber', () => {
    const mockQueueEntry = {
      id: 1,
      patientId: 1,
      queueNumber: 1,
      status: 'waiting',
      priority: 'normal',
      patient: { name: 'John Doe' },
    };

    it('should return queue entry by queue number', async () => {
      mockQueueRepository.findOne.mockResolvedValue(mockQueueEntry);

      const result = await service.findByQueueNumber(1);

      expect(mockQueueRepository.findOne).toHaveBeenCalledWith({
        where: { queueNumber: 1 },
        relations: ['patient'],
      });
      expect(result).toEqual(mockQueueEntry);
    });

    it('should throw NotFoundException if queue entry not found', async () => {
      mockQueueRepository.findOne.mockResolvedValue(null);

      await expect(service.findByQueueNumber(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    const mockQueueEntry = {
      id: 1,
      patientId: 1,
      queueNumber: 1,
      status: 'waiting',
      priority: 'normal',
      patient: { name: 'John Doe' },
    };

    const updateDto: UpdateQueueEntryDto = {
      status: 'with_doctor',
    };

    it('should update queue entry status', async () => {
      const updatedEntry = { ...mockQueueEntry, status: 'with_doctor' };

      mockQueueRepository.findOne
        .mockResolvedValueOnce(mockQueueEntry) // findOne call
        .mockResolvedValueOnce(updatedEntry); // findOne call after save
      mockQueueRepository.save.mockResolvedValue(updatedEntry);
      mockQueueRepository.find.mockResolvedValue([]); // For updateEstimatedWaitTimes

      const result = await service.updateStatus(1, updateDto);

      expect(mockQueueRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedEntry);
    });

    it('should throw NotFoundException if queue entry not found', async () => {
      mockQueueRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(999, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFromQueue', () => {
    const mockQueueEntry = {
      id: 1,
      patientId: 1,
      queueNumber: 1,
      status: 'waiting',
      priority: 'normal',
      patient: { name: 'John Doe' },
    };

    it('should remove queue entry', async () => {
      mockQueueRepository.findOne.mockResolvedValue(mockQueueEntry);
      mockQueueRepository.remove.mockResolvedValue(mockQueueEntry);
      mockQueueRepository.find.mockResolvedValue([]); // For updateEstimatedWaitTimes

      await service.removeFromQueue(1);

      expect(mockQueueRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['patient'],
      });
      expect(mockQueueRepository.remove).toHaveBeenCalledWith(mockQueueEntry);
    });

    it('should throw NotFoundException if queue entry not found', async () => {
      mockQueueRepository.findOne.mockResolvedValue(null);

      await expect(service.removeFromQueue(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      mockQueueRepository.count
        .mockResolvedValueOnce(5) // totalWaiting
        .mockResolvedValueOnce(2) // totalWithDoctor
        .mockResolvedValueOnce(10) // totalCompleted
        .mockResolvedValueOnce(1); // urgentWaiting

      mockQueryBuilder.getMany.mockResolvedValue([
        {
          arrivalTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          updatedAt: new Date(),
        },
        {
          arrivalTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getQueueStats();

      expect(result).toEqual({
        totalWaiting: 5,
        totalWithDoctor: 2,
        totalCompleted: 10,
        urgentWaiting: 1,
        averageWaitTime: expect.any(Number),
      });
    });
  });

  describe('getCurrentQueue', () => {
    const mockCurrentQueue = [
      {
        id: 1,
        status: 'waiting',
        priority: 'urgent',
        queueNumber: 1,
        patient: { name: 'John Doe' },
      },
      {
        id: 2,
        status: 'waiting',
        priority: 'normal',
        queueNumber: 2,
        patient: { name: 'Jane Smith' },
      },
    ];

    it('should return current waiting queue', async () => {
      mockQueueRepository.find.mockResolvedValue(mockCurrentQueue);

      const result = await service.getCurrentQueue();

      expect(mockQueueRepository.find).toHaveBeenCalledWith({
        where: { status: 'waiting' },
        relations: ['patient'],
        order: {
          priority: 'DESC',
          queueNumber: 'ASC',
        },
      });
      expect(result).toEqual(mockCurrentQueue);
    });
  });

  describe('searchQueue', () => {
    const mockSearchResults = [
      {
        id: 1,
        patient: { name: 'John Doe' },
        priority: 'normal',
        queueNumber: 1,
      },
    ];

    it('should return search results', async () => {
      mockQueryBuilder.getMany.mockResolvedValue(mockSearchResults);

      const result = await service.searchQueue('John');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(patient.name LIKE :search OR patient.contactInfo LIKE :search OR patient.medicalRecordNumber LIKE :search)',
        { search: '%John%' },
      );
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockSearchResults);
    });

    it('should return empty array for empty search term', async () => {
      const result = await service.searchQueue('');

      expect(result).toEqual([]);
      expect(mockQueueRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return empty array for whitespace search term', async () => {
      const result = await service.searchQueue('   ');

      expect(result).toEqual([]);
      expect(mockQueueRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});