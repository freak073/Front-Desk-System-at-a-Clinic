import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan, Between } from "typeorm";
import { Appointment } from "../entities/appointment.entity";
import { Doctor } from "../entities/doctor.entity";
import { Patient } from "../entities/patient.entity";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { AppointmentQueryDto } from "./dto/appointment-query.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { CacheService } from "../services/cache.service";

@Injectable()
export class AppointmentsService {
  async update(
    id: number,
    updateDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    // Allow updating status, notes, appointmentDatetime and doctorId (reschedule)
    if (updateDto.status) {
      appointment.status = updateDto.status;
    }
    if (updateDto.notes !== undefined) {
      appointment.notes = updateDto.notes;
    }
    const changingDoctor =
      typeof updateDto.doctorId === "number" &&
      updateDto.doctorId !== appointment.doctorId;
    const changingTime =
      typeof updateDto.appointmentDatetime === "string" &&
      new Date(updateDto.appointmentDatetime).toISOString() !==
        appointment.appointmentDatetime.toISOString();
    if (changingDoctor || changingTime) {
      // Validate doctor if changed
      if (changingDoctor) {
        const newDoctorId = Number(updateDto.doctorId);
        if (!newDoctorId || Number.isNaN(newDoctorId)) {
          throw new BadRequestException("Doctor ID must be a valid number");
        }
        const newDoctor = await this.doctorRepository.findOne({
          where: { id: newDoctorId },
        });
        if (!newDoctor) {
          throw new NotFoundException(
            `Doctor with ID ${newDoctorId} not found`,
          );
        }
        appointment.doctorId = newDoctorId;
      }
      // Validate new date/time
      if (typeof updateDto.appointmentDatetime === "string") {
        const newDate = new Date(updateDto.appointmentDatetime);
        if (isNaN(newDate.getTime())) {
          throw new BadRequestException("Invalid appointment date");
        }
        if (newDate <= new Date()) {
          throw new BadRequestException(
            "Appointment time must be in the future",
          );
        }
        // Conflict check for (possibly new) doctor/time
        const conflict = await this.appointmentRepository.findOne({
          where: {
            doctorId: appointment.doctorId,
            appointmentDatetime: newDate,
          },
        });
        if (conflict && conflict.id !== appointment.id) {
          throw new ConflictException(
            "Doctor is not available at the requested time",
          );
        }
        appointment.appointmentDatetime = newDate;
      }
      // When rescheduling keep status booked unless explicitly changed to canceled/completed
      if (!updateDto.status && appointment.status === "canceled") {
        appointment.status = "booked";
      }
    }
    const saved = await this.appointmentRepository.save(appointment);
    // Invalidate related cache keys (broad strategy)
    this.cacheService?.clear?.();
    return saved;
  }

  async remove(id: number): Promise<void> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    await this.appointmentRepository.remove(appointment);
  }
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly cacheService: CacheService,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const patientIdNum = Number(createAppointmentDto.patientId);
    const doctorIdNum = Number(createAppointmentDto.doctorId);
    const { appointmentDatetime, notes } = createAppointmentDto;
    if (!patientIdNum || Number.isNaN(patientIdNum)) {
      throw new BadRequestException("Patient ID must be a valid number");
    }
    if (!doctorIdNum || Number.isNaN(doctorIdNum)) {
      throw new BadRequestException("Doctor ID must be a valid number");
    }
    const patient = await this.patientRepository.findOne({
      where: { id: patientIdNum },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientIdNum} not found`);
    }
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorIdNum },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorIdNum} not found`);
    }
    const appointmentDate = new Date(appointmentDatetime);
    if (isNaN(appointmentDate.getTime())) {
      throw new BadRequestException("Invalid appointment date");
    }
    if (appointmentDate <= new Date()) {
      throw new BadRequestException("Appointment time must be in the future");
    }
    // Check if doctor is available at the requested time
    const existing = await this.appointmentRepository.findOne({
      where: { doctorId: doctorIdNum, appointmentDatetime: appointmentDate },
    });
    if (existing) {
      throw new ConflictException(
        "Doctor is not available at the requested time",
      );
    }
    const appointment = this.appointmentRepository.create({
      patientId: patientIdNum,
      doctorId: doctorIdNum,
      appointmentDatetime: appointmentDate,
      notes,
      status: "booked",
    });
    return await this.appointmentRepository.save(appointment);
  }

  async findAll(query: AppointmentQueryDto = {}): Promise<{
    appointments: Appointment[];
    total: number;
    totalPages: number;
  }> {
    const qb = this.appointmentRepository
      .createQueryBuilder("appointment")
      .leftJoinAndSelect("appointment.patient", "patient")
      .leftJoinAndSelect("appointment.doctor", "doctor");
    if (query.patientName) {
      qb.andWhere("patient.name LIKE :patientName", {
        patientName: `%${query.patientName}%`,
      });
    }
    if (typeof query.doctorId === "number") {
      qb.andWhere("appointment.doctorId = :doctorId", {
        doctorId: query.doctorId,
      });
    }
    if (query.status) {
      qb.andWhere("appointment.status = :status", { status: query.status });
    }
    if (query.startDate && query.endDate) {
      qb.andWhere("appointment.appointmentDatetime BETWEEN :start AND :end", {
        start: query.startDate,
        end: query.endDate,
      });
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy("appointment.appointmentDatetime", "ASC");

    const cacheKey = this.cacheService.generateKey("appointments:list", {
      ...query,
      page,
      limit,
    });
    const { appointments, total } = await this.cacheService.wrap(
      { key: cacheKey, ttl: 60 }, // short TTL for near-real-time data
      async () => {
        const [items, count] = await qb.getManyAndCount();
        return { appointments: items, total: count };
      },
    );
    return {
      appointments,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ["patient", "doctor"],
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    return appointment;
  }

  async getAvailableSlots(doctorId: number, date: string): Promise<string[]> {
    doctorId = Number(doctorId);
    if (!doctorId || isNaN(doctorId)) {
      throw new BadRequestException("Doctor ID must be a valid number");
    }
    if (!date) {
      throw new BadRequestException("Date is required");
    }
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }
    // For simplicity, assume slots every hour from 9 to 17
    const slots: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      slots.push(`${date}T${hour.toString().padStart(2, "0")}:00:00.000Z`);
    }
    // Remove slots already booked
    const appointments = await this.appointmentRepository.find({
      where: {
        doctorId,
        appointmentDatetime: Between(
          new Date(`${date}T00:00:00.000Z`),
          new Date(`${date}T23:59:59.999Z`),
        ),
      },
    });
    const bookedTimes = appointments.map((a) =>
      a.appointmentDatetime.toISOString(),
    );
    return slots.filter((slot) => !bookedTimes.includes(slot));
  }

  async getStatusStatistics(): Promise<{ status: string; count: number }[]> {
    const qb = this.appointmentRepository
      .createQueryBuilder("appointment")
      .select("appointment.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("appointment.status");
    const raw: Array<{ status: string; count: string }> = await qb.getRawMany();
    return raw.map((r) => ({ status: r.status, count: Number(r.count) }));
  }

  async getTodaysAppointments(): Promise<Appointment[]> {
    const today = new Date();
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
    );
    const end = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );
    return await this.appointmentRepository.find({
      where: {
        appointmentDatetime: Between(start, end),
      },
      relations: ["patient", "doctor"],
      order: { appointmentDatetime: "ASC" },
    });
  }

  async getUpcomingAppointments(limit: number): Promise<Appointment[]> {
    const now = new Date();
    return await this.appointmentRepository.find({
      where: {
        appointmentDatetime: MoreThan(now),
        status: "booked",
      },
      relations: ["patient", "doctor"],
      order: { appointmentDatetime: "ASC" },
      take: limit,
    });
  }
}
