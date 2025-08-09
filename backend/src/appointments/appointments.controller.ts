import { ApiTags } from '@nestjs/swagger';
import {   
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';


function getValidAppointmentDateTime() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    // Strictly parse and validate IDs
    let { patientId, doctorId, appointmentDatetime, notes } = createAppointmentDto;
    patientId = Number(patientId);
    doctorId = Number(doctorId);
    if (!patientId || isNaN(patientId)) {
      throw new BadRequestException('Patient ID must be a valid number');
    }
    if (!doctorId || isNaN(doctorId)) {
      throw new BadRequestException('Doctor ID must be a valid number');
    }
    if (!appointmentDatetime) {
      throw new BadRequestException('Appointment date/time is required');
    }
    const appointment = await this.appointmentsService.create({ patientId, doctorId, appointmentDatetime, notes });
    return { success: true, data: appointment };
  }

  @Get()
  async findAll(@Query() query: AppointmentQueryDto) {
    const result = await this.appointmentsService.findAll(query);
    return {
      success: true,
      data: result.appointments,
      pagination: {
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }


  @Get('available-slots')
  async getAvailableSlots(@Query() query: AvailableSlotsQueryDto) {
    // Validate doctorId and date
    const doctorId = Number(query.doctorId);
    if (!doctorId || isNaN(doctorId)) {
      throw new BadRequestException('Doctor ID must be a valid number');
    }
    if (!query.date) {
      throw new BadRequestException('Date is required');
    }
    const slots = await this.appointmentsService.getAvailableSlots(doctorId, query.date);
    return { success: true, data: slots };
  }

  @Get(':id(\\d+)')
  async findOne(@Param('id') id: string) {
    const numId = Number(id);
    if (!numId || isNaN(numId)) {
      throw new BadRequestException('Appointment ID must be a valid number');
    }
    const appointment = await this.appointmentsService.findOne(numId);
    return { success: true, data: appointment };
  }

  @Get('statistics/status')
  async getStatusStatistics() {
    const stats = await this.appointmentsService.getStatusStatistics();
    return { success: true, data: stats };
  }

  @Get('today')
  async getTodaysAppointments() {
    const appointments = await this.appointmentsService.getTodaysAppointments();
    return { success: true, data: appointments };
  }

  @Get('upcoming')
  async getUpcomingAppointments(@Query('limit') limit: number) {
    const appointments = await this.appointmentsService.getUpcomingAppointments(Number(limit) || 10);
    return { success: true, data: appointments };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateAppointmentDto) {
    const numId = Number(id);
    if (!numId || isNaN(numId)) {
      throw new BadRequestException('Appointment ID must be a valid number');
    }
    const updated = await this.appointmentsService.update(numId, updateDto);
    return { success: true, data: updated };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const numId = Number(id);
    if (!numId || isNaN(numId)) {
      throw new BadRequestException('Appointment ID must be a valid number');
    }
    await this.appointmentsService.remove(numId);
  }
}