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
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto, DoctorResponseDto, DoctorQueryDto, UpdateDoctorScheduleDto } from './dto';
import { plainToClass } from 'class-transformer';

@ApiTags('Doctors')
@Controller('doctors')
@UseInterceptors(ClassSerializerInterceptor)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  async create(@Body() createDoctorDto: CreateDoctorDto): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.create(createDoctorDto);
    return plainToClass(DoctorResponseDto, doctor);
  }

  @Get()
  async findAll(@Query() query: DoctorQueryDto): Promise<DoctorResponseDto[]> {
    const doctors = await this.doctorsService.findAll(query);
    return doctors.map(doctor => plainToClass(DoctorResponseDto, doctor));
  }

  @Get('available')
  async findAvailable(): Promise<DoctorResponseDto[]> {
    const doctors = await this.doctorsService.findAvailable();
    return doctors.map(doctor => plainToClass(DoctorResponseDto, doctor));
  }

  @Get('specialization/:specialization')
  async findBySpecialization(
    @Param('specialization') specialization: string,
  ): Promise<DoctorResponseDto[]> {
    const doctors = await this.doctorsService.findBySpecialization(specialization);
    return doctors.map(doctor => plainToClass(DoctorResponseDto, doctor));
  }

  @Get('location/:location')
  async findByLocation(
    @Param('location') location: string,
  ): Promise<DoctorResponseDto[]> {
    const doctors = await this.doctorsService.findByLocation(location);
    return doctors.map(doctor => plainToClass(DoctorResponseDto, doctor));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.findOne(id);
    return plainToClass(DoctorResponseDto, doctor);
  }

  @Get(':id/availability')
  async getAvailability(@Param('id', ParseIntPipe) id: number) {
    const availability = await this.doctorsService.getAvailability(id);
    return {
      doctor: plainToClass(DoctorResponseDto, availability.doctor),
      nextAvailableTime: availability.nextAvailableTime,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.update(id, updateDoctorDto);
    return plainToClass(DoctorResponseDto, doctor);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'available' | 'busy' | 'off_duty',
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.updateStatus(id, status);
    return plainToClass(DoctorResponseDto, doctor);
  }

  @Patch(':id/schedule')
  async updateSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateDoctorScheduleDto,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.updateSchedule(id, body);
    return plainToClass(DoctorResponseDto, doctor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.doctorsService.remove(id);
  }
}