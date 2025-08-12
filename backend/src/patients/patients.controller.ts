import { ApiTags } from "@nestjs/swagger";
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
} from "@nestjs/common";
import { PatientsService } from "./patients.service";
import {
  CreatePatientDto,
  UpdatePatientDto,
  PatientResponseDto,
  PatientQueryDto,
} from "./dto";
import { plainToClass } from "class-transformer";
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from "../common/dto/api-response.dto";

@ApiTags("Patients")
@Controller("patients")
@UseInterceptors(ClassSerializerInterceptor)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  async create(
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<ApiResponseDto<PatientResponseDto>> {
    const patient = await this.patientsService.create(createPatientDto);
    return ApiResponseDto.success(plainToClass(PatientResponseDto, patient));
  }

  @Get()
  async findAll(
    @Query() query: PatientQueryDto,
  ): Promise<PaginatedResponseDto<PatientResponseDto>> {
    const patients = await this.patientsService.findAll(query);
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[PatientsController] findAll returned ${patients.length} patients`,
      );
    }
    return new PaginatedResponseDto(
      patients.map((p) => plainToClass(PatientResponseDto, p)),
      {
        page: 1,
        limit: patients.length || 0,
        total: patients.length,
        totalPages: 1,
      },
    );
  }

  @Get("search")
  async search(
    @Query("q") searchTerm: string,
  ): Promise<PaginatedResponseDto<PatientResponseDto>> {
    const patients = await this.patientsService.search(searchTerm);
    return new PaginatedResponseDto(
      patients.map((p) => plainToClass(PatientResponseDto, p)),
      {
        page: 1,
        limit: patients.length || 0,
        total: patients.length,
        totalPages: 1,
      },
    );
  }

  @Get("medical-record/:medicalRecordNumber")
  async findByMedicalRecordNumber(
    @Param("medicalRecordNumber") medicalRecordNumber: string,
  ): Promise<ApiResponseDto<PatientResponseDto>> {
    const patient =
      await this.patientsService.findByMedicalRecordNumber(medicalRecordNumber);
    return ApiResponseDto.success(plainToClass(PatientResponseDto, patient));
  }

  @Get("validate-medical-record/:medicalRecordNumber")
  async validateMedicalRecordNumber(
    @Param("medicalRecordNumber") medicalRecordNumber: string,
    @Query("excludeId") excludeId?: string,
  ): Promise<ApiResponseDto<{ isValid: boolean }>> {
    const excludeIdNumber = excludeId ? parseInt(excludeId, 10) : undefined;
    const isValid = await this.patientsService.validateMedicalRecordNumber(
      medicalRecordNumber,
      excludeIdNumber,
    );
    return ApiResponseDto.success({ isValid });
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<PatientResponseDto>> {
    const patient = await this.patientsService.findOne(id);
    return ApiResponseDto.success(plainToClass(PatientResponseDto, patient));
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatePatientDto: UpdatePatientDto,
  ): Promise<ApiResponseDto<PatientResponseDto>> {
    const patient = await this.patientsService.update(id, updatePatientDto);
    return ApiResponseDto.success(plainToClass(PatientResponseDto, patient));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    await this.patientsService.remove(id);
  }
}
