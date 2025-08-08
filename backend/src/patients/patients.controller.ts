import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto, PatientResponseDto, PatientQueryDto } from './dto';
import { plainToClass } from 'class-transformer';

@Controller('patients')
@UseInterceptors(ClassSerializerInterceptor)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  async create(@Body() createPatientDto: CreatePatientDto): Promise<PatientResponseDto> {
    const patient = await this.patientsService.create(createPatientDto);
    return plainToClass(PatientResponseDto, patient);
  }

  @Get()
  async findAll(@Query() query: PatientQueryDto): Promise<PatientResponseDto[]> {
    const patients = await this.patientsService.findAll(query);
    return patients.map(patient => plainToClass(PatientResponseDto, patient));
  }

  @Get('search')
  async search(@Query('q') searchTerm: string): Promise<PatientResponseDto[]> {
    const patients = await this.patientsService.search(searchTerm);
    return patients.map(patient => plainToClass(PatientResponseDto, patient));
  }

  @Get('medical-record/:medicalRecordNumber')
  async findByMedicalRecordNumber(
    @Param('medicalRecordNumber') medicalRecordNumber: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientsService.findByMedicalRecordNumber(medicalRecordNumber);
    return plainToClass(PatientResponseDto, patient);
  }

  @Get('validate-medical-record/:medicalRecordNumber')
  async validateMedicalRecordNumber(
    @Param('medicalRecordNumber') medicalRecordNumber: string,
    @Query('excludeId') excludeId?: string,
  ): Promise<{ isValid: boolean }> {
    const excludeIdNumber = excludeId ? parseInt(excludeId, 10) : undefined;
    const isValid = await this.patientsService.validateMedicalRecordNumber(
      medicalRecordNumber,
      excludeIdNumber,
    );
    return { isValid };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PatientResponseDto> {
    const patient = await this.patientsService.findOne(id);
    return plainToClass(PatientResponseDto, patient);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePatientDto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientsService.update(id, updatePatientDto);
    return plainToClass(PatientResponseDto, patient);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.patientsService.remove(id);
  }
}