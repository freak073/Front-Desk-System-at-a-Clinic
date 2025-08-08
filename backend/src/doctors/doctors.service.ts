import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { CreateDoctorDto, UpdateDoctorDto, DoctorQueryDto } from './dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    try {
      const doctor = this.doctorRepository.create(createDoctorDto);
      return await this.doctorRepository.save(doctor);
    } catch (error) {
      throw new BadRequestException('Failed to create doctor');
    }
  }

  async findAll(query?: DoctorQueryDto): Promise<Doctor[]> {
    const queryBuilder = this.doctorRepository.createQueryBuilder('doctor');

    if (query?.specialization) {
      queryBuilder.andWhere('doctor.specialization = :specialization', {
        specialization: query.specialization,
      });
    }

    if (query?.location) {
      queryBuilder.andWhere('doctor.location = :location', {
        location: query.location,
      });
    }

    if (query?.status) {
      queryBuilder.andWhere('doctor.status = :status', {
        status: query.status,
      });
    }

    if (query?.search) {
      queryBuilder.andWhere(
        '(doctor.name LIKE :search OR doctor.specialization LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({ where: { id } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return doctor;
  }

  async update(id: number, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findOne(id);
    
    Object.assign(doctor, updateDoctorDto);
    
    try {
      return await this.doctorRepository.save(doctor);
    } catch (error) {
      throw new BadRequestException('Failed to update doctor');
    }
  }

  async remove(id: number): Promise<void> {
    const doctor = await this.findOne(id);
    await this.doctorRepository.remove(doctor);
  }

  async updateStatus(id: number, status: 'available' | 'busy' | 'off_duty'): Promise<Doctor> {
    const doctor = await this.findOne(id);
    doctor.status = status;
    
    try {
      return await this.doctorRepository.save(doctor);
    } catch (error) {
      throw new BadRequestException('Failed to update doctor status');
    }
  }

  async findBySpecialization(specialization: string): Promise<Doctor[]> {
    return await this.doctorRepository.find({
      where: { specialization },
    });
  }

  async findByLocation(location: string): Promise<Doctor[]> {
    return await this.doctorRepository.find({
      where: { location },
    });
  }

  async findAvailable(): Promise<Doctor[]> {
    return await this.doctorRepository.find({
      where: { status: 'available' },
    });
  }

  async getAvailability(id: number): Promise<{ doctor: Doctor; nextAvailableTime: string | null }> {
    const doctor = await this.findOne(id);
    
    // For now, return a simple next available time calculation
    // In a real implementation, this would check against actual appointments
    let nextAvailableTime: string | null = null;
    
    if (doctor.status === 'available') {
      // Simple logic: next available is in 1 hour from now
      const nextTime = new Date();
      nextTime.setHours(nextTime.getHours() + 1);
      nextAvailableTime = nextTime.toISOString();
    } else if (doctor.status === 'busy') {
      // If busy, next available is in 2 hours
      const nextTime = new Date();
      nextTime.setHours(nextTime.getHours() + 2);
      nextAvailableTime = nextTime.toISOString();
    }
    // If off_duty, nextAvailableTime remains null
    
    return {
      doctor,
      nextAvailableTime,
    };
  }
}