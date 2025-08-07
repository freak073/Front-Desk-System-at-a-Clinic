// Common types for the frontend application

export interface User {
  id: number;
  username: string;
  role: 'front_desk';
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  gender: 'male' | 'female' | 'other';
  location: string;
  availabilitySchedule?: {
    [day: string]: {
      start: string;
      end: string;
    };
  };
  status: 'available' | 'busy' | 'off_duty';
  appointments?: Appointment[];
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: number;
  name: string;
  contactInfo?: string;
  medicalRecordNumber?: string;
  queueEntries?: QueueEntry[];
  appointments?: Appointment[];
  createdAt: string;
  updatedAt: string;
}

export interface QueueEntry {
  id: number;
  patientId: number;
  queueNumber: number;
  status: 'waiting' | 'with_doctor' | 'completed';
  priority: 'normal' | 'urgent';
  arrivalTime: string;
  estimatedWaitTime?: number;
  patient?: Patient;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDatetime: string;
  status: 'booked' | 'completed' | 'canceled';
  notes?: string;
  patient?: Patient;
  doctor?: Doctor;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  datetime: string;
  available: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types for creating/updating entities
export interface CreateDoctorDto {
  name: string;
  specialization: string;
  gender: 'male' | 'female' | 'other';
  location: string;
  availabilitySchedule?: object;
  status?: 'available' | 'busy' | 'off_duty';
}

export interface UpdateDoctorDto extends Partial<CreateDoctorDto> {}

export interface CreatePatientDto {
  name: string;
  contactInfo?: string;
  medicalRecordNumber?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {}

export interface CreateQueueEntryDto {
  patientId: number;
  priority?: 'normal' | 'urgent';
  estimatedWaitTime?: number;
}

export interface UpdateQueueEntryDto {
  status?: 'waiting' | 'with_doctor' | 'completed';
  priority?: 'normal' | 'urgent';
  estimatedWaitTime?: number;
}

export interface CreateAppointmentDto {
  patientId: number;
  doctorId: number;
  appointmentDatetime: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  appointmentDatetime?: string;
  status?: 'booked' | 'completed' | 'canceled';
  notes?: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  message?: string;
}