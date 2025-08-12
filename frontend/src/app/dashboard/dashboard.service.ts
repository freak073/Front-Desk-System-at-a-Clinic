import { apiService } from '../../lib/api';
import { unwrapEnvelope } from '../../lib/unwrapEnvelope';

export interface DashboardStats {
  queueCount: number;
  todayAppointments: number;
  availableDoctors: number;
  averageWaitTime: number;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await apiService.get<any>('/dashboard/stats');
    const stats = unwrapEnvelope<DashboardStats | undefined>(response);
    return stats ?? {
      queueCount: 0,
      todayAppointments: 0,
      availableDoctors: 0,
      averageWaitTime: 0
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return {
      queueCount: 0,
      todayAppointments: 0,
      availableDoctors: 0,
      averageWaitTime: 0
    };
  }
};


