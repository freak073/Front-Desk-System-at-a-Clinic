import { ApiTags } from '@nestjs/swagger';
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

@ApiTags('Patients')
@Controller('patients')
@UseInterceptors(ClassSerializerInterceptor)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  async create(@Body() createPatientDto: CreatePatientDto): Promise<PatientResponseDto> {
    const patient = await this.patientsService.create(createPatientDto);
  return { success: true, data: plainToClass(PatientResponseDto, patient) } as any;
  }

  @Get()
  async findAll(@Query() query: PatientQueryDto): Promise<{ success: true; data: PatientResponseDto[]; meta: { total: number }; }> {
    const patients = await this.patientsService.findAll(query);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[PatientsController] findAll returned ${patients.length} patients`);
    }
    return {
      success: true,
      data: patients.map(patient => plainToClass(PatientResponseDto, patient)),
      meta: { total: patients.length }
    };
  }

  @Get('search')
  async search(@Query('q') searchTerm: string): Promise<{ success: true; data: PatientResponseDto[]; meta: { total: number }; }> {
    const patients = await this.patientsService.search(searchTerm);
    return { success: true, data: patients.map(patient => plainToClass(PatientResponseDto, patient)), meta: { total: patients.length } };
  }

  @Get('medical-record/:medicalRecordNumber')
  async findByMedicalRecordNumber(
    @Param('medicalRecordNumber') medicalRecordNumber: string,
  ): Promise<any> {
    const patient = await this.patientsService.findByMedicalRecordNumber(medicalRecordNumber);
    return { success: true, data: plainToClass(PatientResponseDto, patient) };
  }

  @Get('validate-medical-record/:medicalRecordNumber')
  async validateMedicalRecordNumber(
    @Param('medicalRecordNumber') medicalRecordNumber: string,
    @Query('excludeId') excludeId?: string,
  ): Promise<any> {
    const excludeIdNumber = excludeId ? parseInt(excludeId, 10) : undefined;
    const isValid = await this.patientsService.validateMedicalRecordNumber(
      medicalRecordNumber,
      excludeIdNumber,
    );
    return { success: true, data: { isValid } };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const patient = await this.patientsService.findOne(id);
    return { success: true, data: plainToClass(PatientResponseDto, patient) };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePatientDto: UpdatePatientDto,
  ): Promise<any> {
    const patient = await this.patientsService.update(id, updatePatientDto);
    return { success: true, data: plainToClass(PatientResponseDto, patient) };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.patientsService.remove(id);
  }
}