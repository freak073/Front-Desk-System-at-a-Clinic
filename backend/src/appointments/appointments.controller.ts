import { ApiTags } from "@nestjs/swagger";
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
} from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { AppointmentQueryDto } from "./dto/appointment-query.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AvailableSlotsQueryDto } from "./dto/available-slots-query.dto";
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from "../common/dto/api-response.dto";

// (Former helper getValidAppointmentDateTime removed as unused)

@ApiTags("Appointments")
@Controller("appointments")
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    // Strictly parse and validate IDs (avoid reassigning destructured vars for lint clarity)
    const { appointmentDatetime, notes } = createAppointmentDto;
    const patientId = Number(createAppointmentDto.patientId);
    const doctorId = Number(createAppointmentDto.doctorId);
    if (!patientId || Number.isNaN(patientId)) {
      throw new BadRequestException("Patient ID must be a valid number");
    }
    if (!doctorId || Number.isNaN(doctorId)) {
      throw new BadRequestException("Doctor ID must be a valid number");
    }
    if (!appointmentDatetime) {
      throw new BadRequestException("Appointment date/time is required");
    }
    const appointment = await this.appointmentsService.create({
      patientId,
      doctorId,
      appointmentDatetime,
      notes,
    });
    return ApiResponseDto.success(appointment);
  }

  @Get()
  async findAll(@Query() query: AppointmentQueryDto) {
    const result = await this.appointmentsService.findAll(query);
    return new PaginatedResponseDto(result.appointments, {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      total: result.total,
      totalPages: result.totalPages,
    });
  }

  @Get("available-slots")
  async getAvailableSlots(@Query() query: AvailableSlotsQueryDto) {
    // Validate doctorId and date
    const doctorId = Number(query.doctorId);
    if (!doctorId || isNaN(doctorId)) {
      throw new BadRequestException("Doctor ID must be a valid number");
    }
    if (!query.date) {
      throw new BadRequestException("Date is required");
    }
    const slots = await this.appointmentsService.getAvailableSlots(
      doctorId,
      query.date,
    );
    return ApiResponseDto.success(slots);
  }

  @Get(":id(\\d+)")
  async findOne(@Param("id") id: string) {
    const numId = Number(id);
    if (!numId || isNaN(numId)) {
      throw new BadRequestException("Appointment ID must be a valid number");
    }
    const appointment = await this.appointmentsService.findOne(numId);
    return ApiResponseDto.success(appointment);
  }

  @Get("statistics/status")
  async getStatusStatistics() {
    const stats = await this.appointmentsService.getStatusStatistics();
    return ApiResponseDto.success(stats);
  }

  @Get("today")
  async getTodaysAppointments() {
    const appointments = await this.appointmentsService.getTodaysAppointments();
    return ApiResponseDto.success(appointments);
  }

  @Get("upcoming")
  async getUpcomingAppointments(@Query("limit") limit: number) {
    const appointments = await this.appointmentsService.getUpcomingAppointments(
      Number(limit) || 10,
    );
    return ApiResponseDto.success(appointments);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateAppointmentDto,
  ) {
    const numId = Number(id);
    if (!numId || isNaN(numId)) {
      throw new BadRequestException("Appointment ID must be a valid number");
    }
    const updated = await this.appointmentsService.update(numId, updateDto);
    return ApiResponseDto.success(updated);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    const numId = Number(id);
    if (!numId || isNaN(numId)) {
      throw new BadRequestException("Appointment ID must be a valid number");
    }
    await this.appointmentsService.remove(numId);
  }
}
