import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('react-query', () => ({
  ...jest.requireActual('react-query'),
  useQueryClient: () => ({ invalidateQueries: jest.fn() })
}));

import AppointmentsPage from '../page';

jest.mock('../../../hooks/useRealTimeUpdates', () => ({
  useAppointmentUpdates: () => ({ data: { data: { data: [], meta: { total:0 }}}, isLoading:false, refetch: jest.fn() })
}));

jest.mock('../../../../context/AuthContext', () => ({ useAuth: () => ({}) }));

// mock appointments.service pieces
jest.mock('../appointments.service', () => ({
  fetchDoctors: async () => [{ id:1, name:'Dr A', specialization:'Spec', gender:'male', location:'Loc', status:'available', availabilitySchedule:null, createdAt:'', updatedAt:'' }],
  fetchPatients: async () => [],
  fetchDoctorById: async () => ({ id:1, name:'Dr A', specialization:'Spec', gender:'male', location:'Loc', status:'available', availabilitySchedule:null, createdAt:'', updatedAt:'' }),
  searchAppointmentsAdvanced: jest.fn(),
  createAppointment: jest.fn(),
  cancelAppointment: jest.fn(),
  updateAppointment: jest.fn(),
  updateDoctorSchedule: jest.fn(async () => ({ id:1 }))
}));

describe('Doctor schedule save flow', () => {
  it('saves schedule via updateDoctorSchedule', async () => {
    render(<AppointmentsPage />);
    // open doctor schedule modal
    const viewButtons = await screen.findAllByText('View Schedule');
    fireEvent.click(viewButtons[0]);
    const mondayStart = await screen.findByLabelText('Monday start');
    fireEvent.change(mondayStart, { target: { value: '09:00' } });
    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);
    await waitFor(()=> expect(require('../appointments.service').updateDoctorSchedule).toHaveBeenCalled());
  });
});
