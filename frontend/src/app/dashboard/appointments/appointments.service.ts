import { apiService } from '../../../lib/api';
import { Appointment, Doctor, Patient, CreateAppointmentDto, UpdateAppointmentDto, CreateDoctorDto, UpdateDoctorDto } from '../../../types';

export interface AppointmentStats {
  booked: number;
  completed: number;
  canceled: number;
}

export const fetchAppointments = async (): Promise<Appointment[]> => {
  try {
    const response = await apiService.get<Appointment[]>('/appointments');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    return [];
  }
};

export const fetchAppointmentById = async (id: number): Promise<Appointment | null> => {
  try {
    const response = await apiService.get<Appointment>(`/appointments/${id}`);
    return response.data || null;
  } catch (error) {
    console.error('Failed to fetch appointment:', error);
    return null;
  }
};

export const fetchTodaysAppointments = async (): Promise<Appointment[]> => {
  try {
    const response = await apiService.get<Appointment[]>('/appointments/today');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch today\'s appointments:', error);
    return [];
  }
};

export const fetchUpcomingAppointments = async (limit: number = 10): Promise<Appointment[]> => {
  try {
    const response = await apiService.get<Appointment[]>('/appointments/upcoming', { limit });
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch upcoming appointments:', error);
    return [];
  }
};

export const fetchAppointmentStats = async (): Promise<AppointmentStats> => {
  try {
    const response = await apiService.get<{ status: string; count: number }[]>('/appointments/statistics/status');
    const stats = response.data || [];
    
    const result: AppointmentStats = {
      booked: 0,
      completed: 0,
      canceled: 0
    };
    
    stats.forEach(stat => {
      if (stat.status === 'booked') result.booked = stat.count;
      if (stat.status === 'completed') result.completed = stat.count;
      if (stat.status === 'canceled') result.canceled = stat.count;
    });
    
    return result;
  } catch (error) {
    console.error('Failed to fetch appointment stats:', error);
    return {
      booked: 0,
      completed: 0,
      canceled: 0
    };
  }
};

export const searchAppointments = async (searchTerm: string): Promise<Appointment[]> => {
  try {
    const response = await apiService.get<Appointment[]>('/appointments', { patientName: searchTerm });
    return response.data || [];
  } catch (error) {
    console.error('Failed to search appointments:', error);
    return [];
  }
};

export const searchAppointmentsAdvanced = async (
  searchTerm?: string,
  status?: string,
  startDate?: string,
  endDate?: string
): Promise<Appointment[]> => {
  try {
    const params: any = {};
    if (searchTerm) params.patientName = searchTerm;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiService.get<Appointment[]>('/appointments', params);
    return response.data || [];
  } catch (error) {
    console.error('Failed to search appointments:', error);
    return [];
  }
};

export const createAppointment = async (data: CreateAppointmentDto): Promise<Appointment | null> => {
  try {
    const response = await apiService.post<Appointment>('/appointments', data);
    return response.data || null;
  } catch (error) {
    console.error('Failed to create appointment:', error);
    return null;
  }
};

export const updateAppointment = async (id: number, data: UpdateAppointmentDto): Promise<Appointment | null> => {
  try {
    const response = await apiService.patch<Appointment>(`/appointments/${id}`, data);
    return response.data || null;
  } catch (error) {
    console.error('Failed to update appointment:', error);
    return null;
  }
};

export const cancelAppointment = async (id: number): Promise<boolean> => {
  try {
    await apiService.patch(`/appointments/${id}`, { status: 'canceled' });
    return true;
  } catch (error) {
    console.error('Failed to cancel appointment:', error);
    return false;
  }
};

export const deleteAppointment = async (id: number): Promise<boolean> => {
  try {
    await apiService.delete(`/appointments/${id}`);
    return true;
  } catch (error) {
    console.error('Failed to delete appointment:', error);
    return false;
  }
};

export const fetchDoctors = async (): Promise<Doctor[]> => {
  try {
    const response = await apiService.get<Doctor[]>('/doctors');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return [];
  }
};

export const searchDoctors = async (searchTerm: string): Promise<Doctor[]> => {
  try {
    const response = await apiService.get<Doctor[]>('/doctors', { search: searchTerm });
    return response.data || [];
  } catch (error) {
    console.error('Failed to search doctors:', error);
    return [];
  }
};

export const filterDoctors = async (
  specialization?: string,
  location?: string,
  status?: string
): Promise<Doctor[]> => {
  try {
    const params: any = {};
    if (specialization) params.specialization = specialization;
    if (location) params.location = location;
    if (status) params.status = status;
    
    const response = await apiService.get<Doctor[]>('/doctors', params);
    return response.data || [];
  } catch (error) {
    console.error('Failed to filter doctors:', error);
    return [];
  }
};

export const fetchAvailableDoctors = async (): Promise<Doctor[]> => {
  try {
    const response = await apiService.get<Doctor[]>('/doctors/available');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch available doctors:', error);
    return [];
  }
};

export const fetchDoctorById = async (id: number): Promise<Doctor | null> => {
  try {
    const response = await apiService.get<Doctor>(`/doctors/${id}`);
    return response.data || null;
  } catch (error) {
    console.error('Failed to fetch doctor:', error);
    return null;
  }
};

export const fetchDoctorAvailability = async (id: number): Promise<{ nextAvailableTime: string | null } | null> => {
  try {
    const response = await apiService.get<{ nextAvailableTime: string | null }>(`/doctors/${id}/availability`);
    return response.data || null;
  } catch (error) {
    console.error('Failed to fetch doctor availability:', error);
    return null;
  }
};

export const createDoctor = async (data: CreateDoctorDto): Promise<Doctor | null> => {
  try {
    const response = await apiService.post<Doctor>('/doctors', data);
    return response.data || null;
  } catch (error) {
    console.error('Failed to create doctor:', error);
    return null;
  }
};

export const updateDoctor = async (id: number, data: UpdateDoctorDto): Promise<Doctor | null> => {
  try {
    const response = await apiService.patch<Doctor>(`/doctors/${id}`, data);
    return response.data || null;
  } catch (error) {
    console.error('Failed to update doctor:', error);
    return null;
  }
};

export const deleteDoctor = async (id: number): Promise<boolean> => {
  try {
    await apiService.delete(`/doctors/${id}`);
    return true;
  } catch (error) {
    console.error('Failed to delete doctor:', error);
    return false;
  }
};

export const fetchPatients = async (): Promise<Patient[]> => {
  try {
  console.debug('[fetchPatients] Requesting /patients');
  const response = await apiService.get<Patient[]>('/patients');
  const data = response.data || [];
  console.debug('[fetchPatients] Received patients:', Array.isArray(data) ? data.length : 'non-array');
  return data;
  } catch (error) {
  console.error('[fetchPatients] Failed:', error);
    return [];
  }
};

export const searchPatients = async (searchTerm: string): Promise<Patient[]> => {
  try {
    const response = await apiService.get<Patient[]>('/patients/search', { q: searchTerm });
    return response.data || [];
  } catch (error) {
    console.error('Failed to search patients:', error);
    return [];
  }
};

export const fetchAvailableSlots = async (doctorId: number, date: string): Promise<string[]> => {
  try {
    const response = await apiService.get<string[]>('/appointments/available-slots', { doctorId, date });
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch available slots:', error);
    return [];
  }
};

export const updateDoctorSchedule = async (id: number, schedule: Record<string,{start:string;end:string;}>) => {
  try {
    const response = await apiService.patch<Doctor>(`/doctors/${id}/schedule`, { schedule });
    return response.data || null;
  } catch (error) {
    console.error('Failed to update doctor schedule:', error);
    return null;
  }
};