import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AppointmentRescheduleForm from '../AppointmentRescheduleForm';

jest.mock('../../appointments/appointments.service', () => ({
  fetchDoctors: jest.fn().mockResolvedValue([{ id:1, name:'Dr A', specialization:'Gen', status:'available', gender:'male', location:'Loc', createdAt:'', updatedAt:'' }]),
  fetchAvailableSlots: jest.fn().mockResolvedValue(['2025-08-11T09:00:00.000Z']),
  updateAppointment: jest.fn().mockResolvedValue({})
}));

const appt:any = { id:5, doctorId:1, patientId:2, appointmentDatetime:'2025-08-10T09:00:00.000Z', status:'booked', createdAt:'', updatedAt:'' };

describe('AppointmentRescheduleForm', () => {
  it('loads slots and submits selection', async () => {
    const onSuccess = jest.fn();
    render(<AppointmentRescheduleForm appointment={appt} onSuccess={onSuccess} onCancel={()=>{}} />);
    // wait for slot
  const slotBtn = await screen.findByRole('button', { name:/09:00|02:30/i });
    fireEvent.click(slotBtn);
    const submit = screen.getByRole('button', { name:/Reschedule/i });
    await act(async ()=>{
      fireEvent.click(submit);
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
