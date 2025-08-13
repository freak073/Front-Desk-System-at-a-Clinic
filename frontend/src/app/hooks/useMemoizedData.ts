import { useMemo, useCallback } from 'react';
import { Doctor, Patient, Appointment, QueueEntry } from '../../types';

// Memoized data processing hooks for expensive computations
export function useMemoizedDoctorData(doctors: Doctor[]) {
  const doctorsBySpecialization = useMemo(() => {
    return doctors.reduce((acc, doctor) => {
      const spec = doctor.specialization;
      if (!acc[spec]) {
        acc[spec] = [];
      }
      acc[spec].push(doctor);
      return acc;
    }, {} as Record<string, Doctor[]>);
  }, [doctors]);

  const availableDoctors = useMemo(() => {
    return doctors.filter(doctor => doctor.status === 'available');
  }, [doctors]);

  const doctorStatusCounts = useMemo(() => {
    return doctors.reduce((acc, doctor) => {
      acc[doctor.status] = (acc[doctor.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [doctors]);

  return {
    doctorsBySpecialization,
    availableDoctors,
    doctorStatusCounts,
  };
}

export function useMemoizedQueueData(queueEntries: QueueEntry[]) {
  const queueByStatus = useMemo(() => {
    return queueEntries.reduce((acc, entry) => {
      const status = entry.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(entry);
      return acc;
    }, {} as Record<string, QueueEntry[]>);
  }, [queueEntries]);

  const urgentPatients = useMemo(() => {
    return queueEntries.filter(entry => entry.priority === 'urgent');
  }, [queueEntries]);

  const averageWaitTime = useMemo(() => {
    const waitingEntries = queueEntries.filter(entry => entry.status === 'waiting');
    if (waitingEntries.length === 0) return 0;
    
    const totalWaitTime = waitingEntries.reduce((sum, entry) => {
      return sum + (entry.estimatedWaitTime || 0);
    }, 0);
    
    return Math.round(totalWaitTime / waitingEntries.length);
  }, [queueEntries]);

  const queueStatistics = useMemo(() => {
    const total = queueEntries.length;
    const waiting = queueEntries.filter(e => e.status === 'waiting').length;
    const withDoctor = queueEntries.filter(e => e.status === 'with_doctor').length;
    const completed = queueEntries.filter(e => e.status === 'completed').length;
    
    return {
      total,
      waiting,
      withDoctor,
      completed,
      averageWaitTime,
    };
  }, [queueEntries, averageWaitTime]);

  return {
    queueByStatus,
    urgentPatients,
    averageWaitTime,
    queueStatistics,
  };
}

export function useMemoizedAppointmentData(appointments: Appointment[]) {
  const appointmentsByDate = useMemo(() => {
    return appointments.reduce((acc, appointment) => {
      const date = new Date(appointment.appointmentDatetime).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(appointment);
      return acc;
    }, {} as Record<string, Appointment[]>);
  }, [appointments]);

  const appointmentsByStatus = useMemo(() => {
    return appointments.reduce((acc, appointment) => {
      const status = appointment.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(appointment);
      return acc;
    }, {} as Record<string, Appointment[]>);
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(appointment => 
        new Date(appointment.appointmentDatetime) > now && 
        appointment.status === 'booked'
      )
      .sort((a, b) => 
        new Date(a.appointmentDatetime).getTime() - new Date(b.appointmentDatetime).getTime()
      );
  }, [appointments]);

  const appointmentStatistics = useMemo(() => {
    const total = appointments.length;
    const booked = appointments.filter(a => a.status === 'booked').length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const canceled = appointments.filter(a => a.status === 'canceled').length;
    
    return {
      total,
      booked,
      completed,
      canceled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [appointments]);

  return {
    appointmentsByDate,
    appointmentsByStatus,
    upcomingAppointments,
    appointmentStatistics,
  };
}

// Memoized search and filter functions
export function useMemoizedSearch<T>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
) {
  return useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && 
               typeof value === 'string' && 
               value.toLowerCase().includes(lowercaseSearch);
      })
    );
  }, [data, searchTerm, searchFields]);
}

export function useMemoizedFilter<T>(
  data: T[],
  filters: Record<string, any>
) {
  return useMemo(() => {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === '' || value === null || value === undefined) return true;
        return (item as any)[key] === value;
      });
    });
  }, [data, filters]);
}

// Debounced callback for expensive operations
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  return useCallback(
    (...args: Parameters<T>) => {
      const timeoutId = setTimeout(() => callback(...args), delay);
      return () => clearTimeout(timeoutId);
    },
    [callback, delay]
  ) as T;
}