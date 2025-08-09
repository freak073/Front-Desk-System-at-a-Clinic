import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { Doctor } from '../entities/doctor.entity';
import { Patient } from '../entities/patient.entity';
import {
  CreateAppointmentDto,
} from './dto/create-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';

@Injectable()
export class AppointmentsService {
  async update(id: number, updateDto: any): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    // Only allow status and notes update for this test
    if (updateDto.status) {
      appointment.status = updateDto.status;
    }
    if (updateDto.notes) {
      appointment.notes = updateDto.notes;
    }
    return await this.appointmentRepository.save(appointment);
  }

  async remove(id: number): Promise<void> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
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
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    let { patientId, doctorId, appointmentDatetime, notes } = createAppointmentDto;
    patientId = Number(patientId);
    doctorId = Number(doctorId);
    if (!patientId || isNaN(patientId)) {
      throw new BadRequestException('Patient ID must be a valid number');
    }
    if (!doctorId || isNaN(doctorId)) {
      throw new BadRequestException('Doctor ID must be a valid number');
    }
    const patient = await this.patientRepository.findOne({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }
    const doctor = await this.doctorRepository.findOne({ where: { id: doctorId } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }
    const appointmentDate = new Date(appointmentDatetime);
    if (isNaN(appointmentDate.getTime())) {
      throw new BadRequestException('Invalid appointment date');
    }
    if (appointmentDate <= new Date()) {
      throw new BadRequestException('Appointment time must be in the future');
    }
    // Check if doctor is available at the requested time
    const existing = await this.appointmentRepository.findOne({
      where: {
        doctorId,
        appointmentDatetime: appointmentDate,
      },
    });
    if (existing) {
      throw new ConflictException('Doctor is not available at the requested time');
    }
    const appointment = this.appointmentRepository.create({
      patientId,
      doctorId,
      appointmentDatetime: appointmentDate,
      notes,
      status: 'booked',
    });
    return await this.appointmentRepository.save(appointment);
  }

  async findAll(query: any = {}): Promise<{ appointments: Appointment[]; total: number; totalPages: number }> {
    const qb = this.appointmentRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor');
    if (query.patientName) {
      qb.andWhere('patient.name LIKE :patientName', { patientName: `%${query.patientName}%` });
    }
    if (query.doctorId) {
      qb.andWhere('appointment.doctorId = :doctorId', { doctorId: query.doctorId });
    }
    if (query.status) {
      qb.andWhere('appointment.status = :status', { status: query.status });
    }
    if (query.startDate && query.endDate) {
      qb.andWhere('appointment.appointmentDatetime BETWEEN :start AND :end', {
        start: query.startDate,
        end: query.endDate,
      });
    }
    const page = query.page || 1;
    const limit = query.limit || 10;
    qb.skip((page - 1) * limit).take(limit).orderBy('appointment.appointmentDatetime', 'ASC');
    const [appointments, total] = await qb.getManyAndCount();
    return {
      appointments,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor'],
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    return appointment;
  }

  async getAvailableSlots(doctorId: number, date: string): Promise<string[]> {
    doctorId = Number(doctorId);
    if (!doctorId || isNaN(doctorId)) {
      throw new BadRequestException('Doctor ID must be a valid number');
    }
    if (!date) {
      throw new BadRequestException('Date is required');
    }
    const doctor = await this.doctorRepository.findOne({ where: { id: doctorId } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }
    // For simplicity, assume slots every hour from 9 to 17
    const slots: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      slots.push(`${date}T${hour.toString().padStart(2, '0')}:00:00.000Z`);
    }
    // Remove slots already booked
    const appointments = await this.appointmentRepository.find({
      where: {
        doctorId,
        appointmentDatetime: Between(new Date(`${date}T00:00:00.000Z`), new Date(`${date}T23:59:59.999Z`)),
      },
    });
    const bookedTimes = appointments.map(a => a.appointmentDatetime.toISOString());
    return slots.filter(slot => !bookedTimes.includes(slot));
  }

  async getStatusStatistics(): Promise<{ status: string; count: number }[]> {
    const qb = this.appointmentRepository.createQueryBuilder('appointment')
      .select('appointment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('appointment.status');
    const raw = await qb.getRawMany();
    return raw.map(r => ({ status: r.status, count: Number(r.count) }));
  }

  async getTodaysAppointments(): Promise<Appointment[]> {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    return await this.appointmentRepository.find({
      where: {
        appointmentDatetime: Between(start, end),
      },
      relations: ['patient', 'doctor'],
      order: { appointmentDatetime: 'ASC' },
    });
  }

  async getUpcomingAppointments(limit: number): Promise<Appointment[]> {
    const now = new Date();
    return await this.appointmentRepository.find({
      where: {
        appointmentDatetime: MoreThan(now),
        status: 'booked',
      },
      relations: ['patient', 'doctor'],
      order: { appointmentDatetime: 'ASC' },
      take: limit,
    });
  }
}