"use client";
import React, { useEffect, useState } from 'react';
import { Doctor, Appointment, UpdateAppointmentDto } from '../../../types';
import { fetchDoctors, fetchAvailableSlots, updateAppointment } from '../appointments/appointments.service';

interface Props {
  appointment: Appointment;
  onSuccess: () => void;
  onCancel: () => void;
}

const AppointmentRescheduleForm: React.FC<Props> = ({ appointment, onSuccess, onCancel }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState<number>(appointment.doctorId);
  const [date, setDate] = useState<string>(appointment.appointmentDatetime ? appointment.appointmentDatetime.split('T')[0] : '');
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors().then(setDoctors);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!doctorId || !date) return;
      setLoadingSlots(true);
      try {
        const s = await fetchAvailableSlots(doctorId, date);
        setSlots(s);
      } catch (e) {
        // surface minimal error state & log
        console.error('Slot load failed', e);
        setError('Failed to load slots');
      } finally {
        setLoadingSlots(false);
      }
    };
    load();
  }, [doctorId, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please choose a time slot');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: UpdateAppointmentDto & { doctorId: number } = { doctorId, appointmentDatetime: selectedSlot } as any;
      await updateAppointment(appointment.id, payload);
      onSuccess();
    } catch (e:any) {
      setError(e.message || 'Failed to reschedule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-describedby={error ? 'reschedule-error' : undefined}>
      {error && <div id="reschedule-error" className="mb-2 text-sm text-red-600">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="doctor">Doctor</label>
          <select id="doctor" value={doctorId} onChange={e => setDoctorId(Number(e.target.value))} className="w-full border rounded px-3 py-2">
            {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="date">Date</label>
            <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <fieldset>
            <legend className="block text-sm font-medium mb-1">Available Slots</legend>
            {loadingSlots && <div className="text-sm text-gray-500">Loading slots...</div>}
            {!loadingSlots && slots.length === 0 && <div className="text-sm text-gray-500">No slots available</div>}
            {!loadingSlots && slots.length > 0 && (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded" aria-label="Available time slots">
                {slots.map(slot => {
                  const time = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const active = selectedSlot === slot;
                  return (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-2 py-1 rounded border text-sm ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-blue-50'}`}
                      aria-pressed={active}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        </div>
        <div className="flex gap-2 pt-2 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button type="submit" disabled={submitting || !selectedSlot} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">{submitting ? 'Saving...' : 'Reschedule'}</button>
        </div>
      </div>
    </form>
  );
};

export default AppointmentRescheduleForm;
