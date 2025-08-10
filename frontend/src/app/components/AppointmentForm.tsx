'use client';

import React, { useState, useEffect } from 'react';
import { Doctor, Patient, CreateAppointmentDto } from '../../types';

interface AppointmentFormProps {
  doctors: Doctor[];
  patients: Patient[];
  onSubmit: (data: CreateAppointmentDto) => void;
  onCancel: () => void;
  initialData?: Partial<CreateAppointmentDto>;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  doctors, 
  patients, 
  onSubmit, 
  onCancel,
  initialData 
}) => {
  const [formData, setFormData] = useState({
    patientId: initialData?.patientId?.toString() || '',
    doctorId: initialData?.doctorId?.toString() || '',
    appointmentDatetime: initialData?.appointmentDatetime || '',
    notes: initialData?.notes || '',
  });
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch available slots when doctor and date are selected
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (formData.doctorId && formData.appointmentDatetime) {
        setLoadingSlots(true);
        try {
          // In a real implementation, you would call an API to get available slots
          // For now, we'll simulate this with some fixed slots
          const date = formData.appointmentDatetime.split('T')[0];
          const slots = [
            `${date}T09:00:00.000Z`,
            `${date}T10:00:00.000Z`,
            `${date}T11:00:00.000Z`,
            `${date}T14:00:00.000Z`,
            `${date}T15:00:00.000Z`,
            `${date}T16:00:00.000Z`,
          ];
          setAvailableSlots(slots);
        } catch (error) {
          console.error('Failed to fetch available slots:', error);
          setAvailableSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      } else {
        setAvailableSlots([]);
      }
    };

    fetchAvailableSlots();
  }, [formData.doctorId, formData.appointmentDatetime]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.patientId) {
      newErrors.patientId = 'Patient is required';
    }
    
    if (!formData.doctorId) {
      newErrors.doctorId = 'Doctor is required';
    }
    
    if (!formData.appointmentDatetime) {
      newErrors.appointmentDatetime = 'Appointment date and time is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        patientId: parseInt(formData.patientId as string),
        doctorId: parseInt(formData.doctorId as string),
        appointmentDatetime: formData.appointmentDatetime,
        notes: formData.notes,
      });
    }
  };

  return (
  <form onSubmit={handleSubmit} className="space-y-4 text-gray-200">
      <div>
  <label htmlFor="patientId" className="block text-sm font-medium text-gray-300 mb-1">
          Patient
        </label>
        <select
          id="patientId"
          name="patientId"
          value={formData.patientId}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
            errors.patientId ? 'border-red-500' : 'border-gray-600'
          }`}
        >
          <option value="">Select a patient</option>
          {patients.map(patient => (
            <option key={patient.id} value={patient.id}>
              {patient.name}
            </option>
          ))}
        </select>
        {errors.patientId && <p className="mt-1 text-sm text-red-600">{errors.patientId}</p>}
      </div>

      <div>
  <label htmlFor="doctorId" className="block text-sm font-medium text-gray-300 mb-1">
          Doctor
        </label>
        <select
          id="doctorId"
          name="doctorId"
          value={formData.doctorId}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
            errors.doctorId ? 'border-red-500' : 'border-gray-600'
          }`}
        >
          <option value="">Select a doctor</option>
          {doctors.map(doctor => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name} - {doctor.specialization}
            </option>
          ))}
        </select>
        {errors.doctorId && <p className="mt-1 text-sm text-red-600">{errors.doctorId}</p>}
      </div>

      <div>
  <label htmlFor="appointmentDatetime" className="block text-sm font-medium text-gray-300 mb-1">
          Appointment Date & Time
        </label>
        <input
          type="datetime-local"
          id="appointmentDatetime"
          name="appointmentDatetime"
          value={formData.appointmentDatetime}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
            errors.appointmentDatetime ? 'border-red-500' : 'border-gray-600'
          }`}
        />
        {errors.appointmentDatetime && <p className="mt-1 text-sm text-red-600">{errors.appointmentDatetime}</p>}
        
        {loadingSlots && (
          <p className="mt-2 text-sm text-gray-500">Loading available time slots...</p>
        )}
        
        {availableSlots.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-300 mb-1">Available Time Slots:</p>
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot, index) => {
                const time = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, appointmentDatetime: slot }))}
                    className={`px-2 py-1 text-xs rounded border ${
                      formData.appointmentDatetime === slot
                        ? 'bg-accent-600 text-white border-accent-600'
                        : 'bg-surface-700 hover:bg-surface-600 border-gray-600 text-gray-300'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div>
  <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-200 bg-surface-700 border border-gray-600 rounded-md hover:bg-surface-600 focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-accent-600 border border-transparent rounded-md hover:bg-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          Schedule Appointment
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;