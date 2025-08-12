import { apiService } from '../../../lib/api';
import { unwrapEnvelope, unwrapWithMeta } from '../../../lib/unwrapEnvelope';
import { Appointment, Doctor, Patient, CreateAppointmentDto, UpdateAppointmentDto, CreateDoctorDto, UpdateDoctorDto } from '../../../types';

export interface AppointmentStats {
  booked: number;
  completed: number;
  canceled: number;
}

export const fetchAppointments = async (): Promise<Appointment[]> => {
  try {
  const response = await apiService.get<any>('/appointments');
  const { data } = unwrapWithMeta<Appointment[]>(response);
  return data || [];
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    return [];
  }
};

export const fetchAppointmentById = async (id: number): Promise<Appointment | null> => {
  try {
  const response = await apiService.get<any>(`/appointments/${id}`);
  return unwrapEnvelope<Appointment | null>(response) || null;
  } catch (error) {
    console.error('Failed to fetch appointment:', error);
    return null;
  }
};

export const fetchTodaysAppointments = async (): Promise<Appointment[]> => {
  try {
  const response = await apiService.get<any>('/appointments/today');
  return unwrapEnvelope<Appointment[]>(response) || [];
  } catch (error) {
    console.error('Failed to fetch today\'s appointments:', error);
    return [];
  }
};

export const fetchUpcomingAppointments = async (limit: number = 10): Promise<Appointment[]> => {
  try {
  const response = await apiService.get<any>('/appointments/upcoming', { limit });
  return unwrapEnvelope<Appointment[]>(response) || [];
  } catch (error) {
    console.error('Failed to fetch upcoming appointments:', error);
    return [];
  }
};

export const fetchAppointmentStats = async (): Promise<AppointmentStats> => {
  try {
  const response = await apiService.get<any>('/appointments/statistics/status');
  const stats = unwrapEnvelope<{ status: string; count: number }[]>(response) || [];
    
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
  const response = await apiService.get<any>('/appointments', { patientName: searchTerm });
  const { data } = unwrapWithMeta<Appointment[]>(response);
  return data || [];
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
    
  const response = await apiService.get<any>('/appointments', params);
  const { data } = unwrapWithMeta<Appointment[]>(response);
  return data || [];
  } catch (error) {
    console.error('Failed to search appointments:', error);
    return [];
  }
};

export const createAppointment = async (data: CreateAppointmentDto): Promise<Appointment | null> => {
  try {
  const response = await apiService.post<any>('/appointments', data);
  return unwrapEnvelope<Appointment | null>(response) || null;
  } catch (error) {
    console.error('Failed to create appointment:', error);
    return null;
  }
};

export const updateAppointment = async (id: number, data: UpdateAppointmentDto): Promise<Appointment | null> => {
  try {
  const response = await apiService.patch<any>(`/appointments/${id}`, data);
  return unwrapEnvelope<Appointment | null>(response) || null;
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
  const response = await apiService.get<any>('/doctors');
  const { data } = unwrapWithMeta<Doctor[]>(response);
  return data || [];
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return [];
  }
};

export const searchDoctors = async (searchTerm: string): Promise<Doctor[]> => {
  try {
  const response = await apiService.get<any>('/doctors', { search: searchTerm });
  const { data } = unwrapWithMeta<Doctor[]>(response);
  return data || [];
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
    
  const response = await apiService.get<any>('/doctors', params);
  const { data } = unwrapWithMeta<Doctor[]>(response);
  return data || [];
  } catch (error) {
    console.error('Failed to filter doctors:', error);
    return [];
  }
};

export const fetchAvailableDoctors = async (): Promise<Doctor[]> => {
  try {
  const response = await apiService.get<any>('/doctors/available');
  return unwrapEnvelope<Doctor[]>(response) || [];
  } catch (error) {
    console.error('Failed to fetch available doctors:', error);
    return [];
  }
};

export const fetchDoctorById = async (id: number): Promise<Doctor | null> => {
  try {
  const response = await apiService.get<any>(`/doctors/${id}`);
  return unwrapEnvelope<Doctor | null>(response) || null;
  } catch (error) {
    console.error('Failed to fetch doctor:', error);
    return null;
  }
};

export const fetchDoctorAvailability = async (id: number): Promise<{ nextAvailableTime: string | null } | null> => {
  try {
  const response = await apiService.get<any>(`/doctors/${id}/availability`);
  return unwrapEnvelope<{ nextAvailableTime: string | null } | null>(response) || null;
  } catch (error) {
    console.error('Failed to fetch doctor availability:', error);
    return null;
  }
};

export const createDoctor = async (data: CreateDoctorDto): Promise<Doctor | null> => {
  try {
  const response = await apiService.post<any>('/doctors', data);
  return unwrapEnvelope<Doctor | null>(response) || null;
  } catch (error) {
    console.error('Failed to create doctor:', error);
    return null;
  }
};

export const updateDoctor = async (id: number, data: UpdateDoctorDto): Promise<Doctor | null> => {
  try {
  const response = await apiService.patch<any>(`/doctors/${id}`, data);
  return unwrapEnvelope<Doctor | null>(response) || null;
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
  const response = await apiService.get<any>('/patients');
  const { data } = unwrapWithMeta<Patient[]>(response);
  console.debug('[fetchPatients] Received patients:', Array.isArray(data) ? data.length : 'non-array');
  return data;
  } catch (error) {
  console.error('[fetchPatients] Failed:', error);
    return [];
  }
};

export const searchPatients = async (searchTerm: string): Promise<Patient[]> => {
  try {
  const response = await apiService.get<any>('/patients/search', { q: searchTerm });
  const { data } = unwrapWithMeta<Patient[]>(response);
  return data || [];
  } catch (error) {
    console.error('Failed to search patients:', error);
    return [];
  }
};

export const fetchAvailableSlots = async (doctorId: number, date: string): Promise<string[]> => {
  try {
  const response = await apiService.get<any>('/appointments/available-slots', { doctorId, date });
  return unwrapEnvelope<string[]>(response) || [];
  } catch (error) {
    console.error('Failed to fetch available slots:', error);
    return [];
  }
};

export const updateDoctorSchedule = async (id: number, schedule: Record<string,{start:string;end:string;}>) => {
  try {
  const response = await apiService.patch<any>(`/doctors/${id}/schedule`, { schedule });
  return unwrapEnvelope<Doctor | null>(response) || null;
  } catch (error) {
    console.error('Failed to update doctor schedule:', error);
    return null;
  }
};