// Common types for the frontend application

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  gender: 'male' | 'female' | 'other';
  location: string;
  availabilitySchedule: any;
  status: 'available' | 'busy' | 'off_duty';
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: number;
  name: string;
  contactInfo?: string;
  medicalRecordNumber?: string;
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
  patient: Patient;
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
  patient: Patient;
  doctor: Doctor;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  datetime: string;
  available: boolean;
}