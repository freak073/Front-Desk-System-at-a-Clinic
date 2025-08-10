import { Injectable } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { DoctorsService } from '../doctors/doctors.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly queueService: QueueService,
    private readonly appointmentsService: AppointmentsService,
    private readonly doctorsService: DoctorsService,
  ) {}

  async getDashboardStats(): Promise<{
    queueCount: number;
    todayAppointments: number;
    availableDoctors: number;
    averageWaitTime: number;
  }> {
    // Get queue statistics
    const queueStats = await this.queueService.getQueueStats();
    
    // Get today's appointments count
    const todayAppointments = await this.appointmentsService.getTodaysAppointments();
    
    // Get available doctors count
    const availableDoctors = await this.doctorsService.findAvailable();
    
    return {
      queueCount: queueStats.totalWaiting,
      todayAppointments: todayAppointments.length,
      availableDoctors: availableDoctors.length,
      averageWaitTime: queueStats.averageWaitTime,
    };
  }
}