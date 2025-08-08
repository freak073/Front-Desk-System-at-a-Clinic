import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { Doctor } from '../entities/doctor.entity';
import { CreateDoctorDto, UpdateDoctorDto, DoctorQueryDto } from './dto';

describe('DoctorsService', () => {
  let service: DoctorsService;
  let repository: Repository<Doctor>;

  const mockDoctor: Doctor = {
    id: 1,
    name: 'Dr. John Smith',
    specialization: 'Cardiology',
    gender: 'male',
    location: 'Building A, Room 101',
    availabilitySchedule: { monday: '9:00-17:00' },
    status: 'available',
    appointments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        {
          provide: getRepositoryToken(Doctor),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
    repository = module.get<Repository<Doctor>>(getRepositoryToken(Doctor));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new doctor', async () => {
      const createDoctorDto: CreateDoctorDto = {
        name: 'Dr. John Smith',
        specialization: 'Cardiology',
        gender: 'male',
        location: 'Building A, Room 101',
      };

      mockRepository.create.mockReturnValue(mockDoctor);
      mockRepository.save.mockResolvedValue(mockDoctor);

      const result = await service.create(createDoctorDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDoctorDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockDoctor);
      expect(result).toEqual(mockDoctor);
    });

    it('should throw BadRequestException when creation fails', async () => {
      const createDoctorDto: CreateDoctorDto = {
        name: 'Dr. John Smith',
        specialization: 'Cardiology',
        gender: 'male',
        location: 'Building A, Room 101',
      };

      mockRepository.create.mockReturnValue(mockDoctor);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createDoctorDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all doctors without filters', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([mockDoctor]);

      const result = await service.findAll();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('doctor');
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual([mockDoctor]);
    });

    it('should filter doctors by specialization', async () => {
      const query: DoctorQueryDto = { specialization: 'Cardiology' };
      
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([mockDoctor]);

      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'doctor.specialization = :specialization',
        { specialization: 'Cardiology' },
      );
      expect(result).toEqual([mockDoctor]);
    });

    it('should filter doctors by location', async () => {
      const query: DoctorQueryDto = { location: 'Building A' };
      
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([mockDoctor]);

      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'doctor.location = :location',
        { location: 'Building A' },
      );
      expect(result).toEqual([mockDoctor]);
    });

    it('should filter doctors by status', async () => {
      const query: DoctorQueryDto = { status: 'available' };
      
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([mockDoctor]);

      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'doctor.status = :status',
        { status: 'available' },
      );
      expect(result).toEqual([mockDoctor]);
    });

    it('should search doctors by name or specialization', async () => {
      const query: DoctorQueryDto = { search: 'John' };
      
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([mockDoctor]);

      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(doctor.name LIKE :search OR doctor.specialization LIKE :search)',
        { search: '%John%' },
      );
      expect(result).toEqual([mockDoctor]);
    });
  });

  describe('findOne', () => {
    it('should return a doctor by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockDoctor);

      const result = await service.findOne(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockDoctor);
    });

    it('should throw NotFoundException when doctor not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a doctor', async () => {
      const updateDoctorDto: UpdateDoctorDto = {
        name: 'Dr. John Updated',
        specialization: 'Neurology',
      };

      const updatedDoctor = { ...mockDoctor, ...updateDoctorDto };

      mockRepository.findOne.mockResolvedValue(mockDoctor);
      mockRepository.save.mockResolvedValue(updatedDoctor);

      const result = await service.update(1, updateDoctorDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDoctorDto),
      );
      expect(result).toEqual(updatedDoctor);
    });

    it('should throw NotFoundException when doctor not found', async () => {
      const updateDoctorDto: UpdateDoctorDto = { name: 'Dr. John Updated' };
      
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDoctorDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when update fails', async () => {
      const updateDoctorDto: UpdateDoctorDto = { name: 'Dr. John Updated' };
      
      mockRepository.findOne.mockResolvedValue(mockDoctor);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.update(1, updateDoctorDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove a doctor', async () => {
      mockRepository.findOne.mockResolvedValue(mockDoctor);
      mockRepository.remove.mockResolvedValue(mockDoctor);

      await service.remove(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockDoctor);
    });

    it('should throw NotFoundException when doctor not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update doctor status', async () => {
      const updatedDoctor = { ...mockDoctor, status: 'busy' };
      
      mockRepository.findOne.mockResolvedValue(mockDoctor);
      mockRepository.save.mockResolvedValue(updatedDoctor);

      const result = await service.updateStatus(1, 'busy');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'busy' }),
      );
      expect(result).toEqual(updatedDoctor);
    });

    it('should throw NotFoundException when doctor not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(999, 'busy')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when status update fails', async () => {
      mockRepository.findOne.mockResolvedValue(mockDoctor);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.updateStatus(1, 'busy')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findBySpecialization', () => {
    it('should return doctors by specialization', async () => {
      mockRepository.find.mockResolvedValue([mockDoctor]);

      const result = await service.findBySpecialization('Cardiology');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { specialization: 'Cardiology' },
      });
      expect(result).toEqual([mockDoctor]);
    });
  });

  describe('findByLocation', () => {
    it('should return doctors by location', async () => {
      mockRepository.find.mockResolvedValue([mockDoctor]);

      const result = await service.findByLocation('Building A');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { location: 'Building A' },
      });
      expect(result).toEqual([mockDoctor]);
    });
  });

  describe('findAvailable', () => {
    it('should return available doctors', async () => {
      mockRepository.find.mockResolvedValue([mockDoctor]);

      const result = await service.findAvailable();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: 'available' },
      });
      expect(result).toEqual([mockDoctor]);
    });
  });
});