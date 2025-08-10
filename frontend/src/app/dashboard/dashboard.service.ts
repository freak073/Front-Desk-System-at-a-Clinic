import { apiService } from '../../lib/api';

export interface DashboardStats {
  queueCount: number;
  todayAppointments: number;
  availableDoctors: number;
  averageWaitTime: number;
}

// export const fetchDashboardStats = async (): Promise<DashboardStats> => {
//   try {
//     const response = await apiService.get<{ data: DashboardStats }>('/dashboard/stats');
//     return response.data!.data;
//   } catch (error) {
//     console.error('Failed to fetch dashboard stats:', error);
//     return {
//       queueCount: 0,
//       todayAppointments: 0,
//       availableDoctors: 0,
//       averageWaitTime: 0
//     };
//   }
// };

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await apiService.get<{ data: DashboardStats }>('/dashboard/stats');
    return response?.data?.data ?? {
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


