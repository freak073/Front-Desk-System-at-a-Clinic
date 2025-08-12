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
import { DoctorsService } from "./doctors.service";
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  DoctorResponseDto,
  DoctorQueryDto,
  UpdateDoctorScheduleDto,
} from "./dto";
import { plainToClass } from "class-transformer";
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from "../common/dto/api-response.dto";

@ApiTags("Doctors")
@Controller("doctors")
@UseInterceptors(ClassSerializerInterceptor)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  async create(
    @Body() createDoctorDto: CreateDoctorDto,
  ): Promise<ApiResponseDto<DoctorResponseDto>> {
    const doctor = await this.doctorsService.create(createDoctorDto);
    return ApiResponseDto.success(plainToClass(DoctorResponseDto, doctor));
  }

  @Get()
  async findAll(
    @Query() query: DoctorQueryDto,
  ): Promise<PaginatedResponseDto<DoctorResponseDto>> {
    const doctors = await this.doctorsService.findAll(query);
    return new PaginatedResponseDto(
      doctors.map((d) => plainToClass(DoctorResponseDto, d)),
      {
        page: 1,
        limit: doctors.length || 0,
        total: doctors.length,
        totalPages: 1,
      },
    );
  }

  @Get("available")
  async findAvailable(): Promise<PaginatedResponseDto<DoctorResponseDto>> {
    const doctors = await this.doctorsService.findAvailable();
    return new PaginatedResponseDto(
      doctors.map((d) => plainToClass(DoctorResponseDto, d)),
      {
        page: 1,
        limit: doctors.length || 0,
        total: doctors.length,
        totalPages: 1,
      },
    );
  }

  @Get("specialization/:specialization")
  async findBySpecialization(
    @Param("specialization") specialization: string,
  ): Promise<PaginatedResponseDto<DoctorResponseDto>> {
    const doctors =
      await this.doctorsService.findBySpecialization(specialization);
    return new PaginatedResponseDto(
      doctors.map((d) => plainToClass(DoctorResponseDto, d)),
      {
        page: 1,
        limit: doctors.length || 0,
        total: doctors.length,
        totalPages: 1,
      },
    );
  }

  @Get("location/:location")
  async findByLocation(
    @Param("location") location: string,
  ): Promise<PaginatedResponseDto<DoctorResponseDto>> {
    const doctors = await this.doctorsService.findByLocation(location);
    return new PaginatedResponseDto(
      doctors.map((d) => plainToClass(DoctorResponseDto, d)),
      {
        page: 1,
        limit: doctors.length || 0,
        total: doctors.length,
        totalPages: 1,
      },
    );
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<DoctorResponseDto>> {
    const doctor = await this.doctorsService.findOne(id);
    return ApiResponseDto.success(plainToClass(DoctorResponseDto, doctor));
  }

  @Get(":id/availability")
  async getAvailability(@Param("id", ParseIntPipe) id: number): Promise<
    ApiResponseDto<{
      doctor: DoctorResponseDto;
      nextAvailableTime: string | null;
    }>
  > {
    const availability = await this.doctorsService.getAvailability(id);
    return ApiResponseDto.success({
      doctor: plainToClass(DoctorResponseDto, availability.doctor),
      nextAvailableTime: availability.nextAvailableTime,
    });
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ): Promise<ApiResponseDto<DoctorResponseDto>> {
    const doctor = await this.doctorsService.update(id, updateDoctorDto);
    return ApiResponseDto.success(plainToClass(DoctorResponseDto, doctor));
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body("status") status: "available" | "busy" | "off_duty",
  ): Promise<ApiResponseDto<DoctorResponseDto>> {
    const doctor = await this.doctorsService.updateStatus(id, status);
    return ApiResponseDto.success(plainToClass(DoctorResponseDto, doctor));
  }

  @Patch(":id/schedule")
  async updateSchedule(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateDoctorScheduleDto,
  ): Promise<ApiResponseDto<DoctorResponseDto>> {
    const doctor = await this.doctorsService.updateSchedule(id, body);
    return ApiResponseDto.success(plainToClass(DoctorResponseDto, doctor));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    await this.doctorsService.remove(id);
  }
}
