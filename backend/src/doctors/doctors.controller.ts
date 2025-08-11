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
    return {
      // unified envelope
      success: true,
      data: plainToClass(DoctorResponseDto, doctor),
    } as any;
  }

  @Get()
  async findAll(@Query() query: DoctorQueryDto): Promise<{ success: true; data: DoctorResponseDto[]; meta: { total: number }; }> {
    const doctors = await this.doctorsService.findAll(query);
    return {
      success: true,
      data: doctors.map(doctor => plainToClass(DoctorResponseDto, doctor)),
      meta: { total: doctors.length }
    };
  }

  @Get('available')
  async findAvailable(): Promise<{ success: true; data: DoctorResponseDto[]; meta: { total: number }; }> {
    const doctors = await this.doctorsService.findAvailable();
    return { success: true, data: doctors.map(doctor => plainToClass(DoctorResponseDto, doctor)), meta: { total: doctors.length } };
  }

  @Get('specialization/:specialization')
  async findBySpecialization(
    @Param('specialization') specialization: string,
  ): Promise<{ success: true; data: DoctorResponseDto[]; meta: { total: number }; }> {
    const doctors = await this.doctorsService.findBySpecialization(specialization);
    return { success: true, data: doctors.map(doctor => plainToClass(DoctorResponseDto, doctor)), meta: { total: doctors.length } };
  }

  @Get('location/:location')
  async findByLocation(
    @Param('location') location: string,
  ): Promise<{ success: true; data: DoctorResponseDto[]; meta: { total: number }; }> {
    const doctors = await this.doctorsService.findByLocation(location);
    return { success: true, data: doctors.map(doctor => plainToClass(DoctorResponseDto, doctor)), meta: { total: doctors.length } };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const doctor = await this.doctorsService.findOne(id);
    return { success: true, data: plainToClass(DoctorResponseDto, doctor) };
  }

  @Get(':id/availability')
  async getAvailability(@Param('id', ParseIntPipe) id: number) {
    const availability = await this.doctorsService.getAvailability(id);
    return {
      success: true,
      data: {
        doctor: plainToClass(DoctorResponseDto, availability.doctor),
        nextAvailableTime: availability.nextAvailableTime,
      },
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ): Promise<any> {
    const doctor = await this.doctorsService.update(id, updateDoctorDto);
    return { success: true, data: plainToClass(DoctorResponseDto, doctor) };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'available' | 'busy' | 'off_duty',
  ): Promise<any> {
    const doctor = await this.doctorsService.updateStatus(id, status);
    return { success: true, data: plainToClass(DoctorResponseDto, doctor) };
  }

  @Patch(':id/schedule')
  async updateSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateDoctorScheduleDto,
  ): Promise<any> {
    const doctor = await this.doctorsService.updateSchedule(id, body);
    return { success: true, data: plainToClass(DoctorResponseDto, doctor) };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.doctorsService.remove(id);
  }
}