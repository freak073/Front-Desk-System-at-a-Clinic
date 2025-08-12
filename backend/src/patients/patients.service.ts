import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { Patient } from "../entities/patient.entity";
import { CreatePatientDto, UpdatePatientDto, PatientQueryDto } from "./dto";

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    try {
      // Check for medical record number uniqueness if provided
      if (createPatientDto.medicalRecordNumber) {
        const existingPatient = await this.patientRepository.findOne({
          where: { medicalRecordNumber: createPatientDto.medicalRecordNumber },
        });

        if (existingPatient) {
          throw new ConflictException("Medical record number already exists");
        }
      }

      const patient = this.patientRepository.create(createPatientDto);
      return await this.patientRepository.save(patient);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException("Failed to create patient");
    }
  }

  async findAll(query?: PatientQueryDto): Promise<Patient[]> {
    const queryBuilder = this.patientRepository.createQueryBuilder("patient");

    if (query?.search) {
      queryBuilder.andWhere(
        "(patient.name LIKE :search OR patient.contactInfo LIKE :search OR patient.medicalRecordNumber LIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    if (query?.name) {
      queryBuilder.andWhere("patient.name LIKE :name", {
        name: `%${query.name}%`,
      });
    }

    if (query?.medicalRecordNumber) {
      queryBuilder.andWhere(
        "patient.medicalRecordNumber = :medicalRecordNumber",
        {
          medicalRecordNumber: query.medicalRecordNumber,
        },
      );
    }

    return await queryBuilder.orderBy("patient.name", "ASC").getMany();
  }

  async findOne(id: number): Promise<Patient> {
    const patient = await this.patientRepository.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }
    return patient;
  }

  async findByMedicalRecordNumber(
    medicalRecordNumber: string,
  ): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { medicalRecordNumber },
    });
    if (!patient) {
      throw new NotFoundException(
        `Patient with medical record number ${medicalRecordNumber} not found`,
      );
    }
    return patient;
  }

  async update(
    id: number,
    updatePatientDto: UpdatePatientDto,
  ): Promise<Patient> {
    const patient = await this.findOne(id);

    // Check for medical record number uniqueness if being updated
    if (
      updatePatientDto.medicalRecordNumber &&
      updatePatientDto.medicalRecordNumber !== patient.medicalRecordNumber
    ) {
      const existingPatient = await this.patientRepository.findOne({
        where: { medicalRecordNumber: updatePatientDto.medicalRecordNumber },
      });

      if (existingPatient) {
        throw new ConflictException("Medical record number already exists");
      }
    }

    Object.assign(patient, updatePatientDto);

    try {
      return await this.patientRepository.save(patient);
    } catch (error) {
      throw new BadRequestException("Failed to update patient");
    }
  }

  async remove(id: number): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientRepository.remove(patient);
  }

  async search(searchTerm: string): Promise<Patient[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const queryBuilder = this.patientRepository.createQueryBuilder("patient");

    queryBuilder.where(
      "(patient.name LIKE :search OR patient.contactInfo LIKE :search OR patient.medicalRecordNumber LIKE :search)",
      { search: `%${searchTerm.trim()}%` },
    );

    return await queryBuilder
      .orderBy("patient.name", "ASC")
      .limit(50) // Limit results for performance
      .getMany();
  }

  async validateMedicalRecordNumber(
    medicalRecordNumber: string,
    excludeId?: number,
  ): Promise<boolean> {
    const queryBuilder = this.patientRepository.createQueryBuilder("patient");

    queryBuilder.where("patient.medicalRecordNumber = :medicalRecordNumber", {
      medicalRecordNumber,
    });

    if (excludeId) {
      queryBuilder.andWhere("patient.id != :excludeId", { excludeId });
    }

    const existingPatient = await queryBuilder.getOne();
    return !existingPatient; // Return true if no existing patient found (valid)
  }
}
