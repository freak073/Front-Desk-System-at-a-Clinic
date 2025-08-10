import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppointmentsPage from '../page';

// Deep clone utility to avoid shared references
const dc = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const baseAppt = {
  id: 1,
  patientId: 1,
  doctorId: 1,
  appointmentDatetime: '2025-08-10T09:00:00.000Z',
  status: 'booked',
  patient: { name: 'Pat' },
  doctor: { name: 'Dr', specialization: 'Spec' }
};

jest.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id:1, role:'admin' }, token:'token', loading:false, error:null, login:jest.fn(), logout:jest.fn(), refreshToken:jest.fn() }),
  AuthProvider: ({children}: any) => children
}));

const updateAppointmentMock = jest.fn(async (id: number, changes: any) => dc({ id, ...changes }));

jest.mock('../appointments.service', () => ({
  updateAppointment: (...args: any[]) => (updateAppointmentMock as any)(...args),
  fetchDoctors: async () => dc([{ id:1, name:'Dr', specialization:'Spec', status:'available', gender:'male', location:'', createdAt:'', updatedAt:'' }]),
  fetchPatients: async () => dc([{ id:1, name:'Pat', createdAt:'', updatedAt:'' }]),
  fetchDoctorAvailability: async () => dc({ nextAvailableTime: null }),
  searchAppointmentsAdvanced: async () => dc([])
}));

let logicalAppointments = [ dc(baseAppt) ];
const realTimeWrapper: any = {
  data: { data: { data: logicalAppointments, meta: { total: 1 } } },
  isLoading: false,
  refetch: jest.fn()
};

const invalidateSpy = jest.fn();
jest.mock('react-query', () => ({
  ...jest.requireActual('react-query'),
  useQueryClient: () => ({ invalidateQueries: invalidateSpy })
}));

jest.mock('../../../hooks/useRealTimeUpdates', () => ({
  useAppointmentUpdates: () => {
    // Replace internal data reference with a fresh deep clone
    realTimeWrapper.data.data.data = logicalAppointments.map(a => dc(a));
    realTimeWrapper.data.data.meta.total = logicalAppointments.length;
    return realTimeWrapper;
  }
}));

describe('Appointments inline status change & highlight', () => {
  beforeEach(() => {
    logicalAppointments = [ dc(baseAppt) ];
    updateAppointmentMock.mockClear();
  });

  it('optimistically updates status and reflects in badge', async () => {
    render(<AppointmentsPage />);
    const select = await screen.findByTestId('appointment-status-select-1');
    expect(select).toHaveValue('booked');
  fireEvent.change(select, { target: { value: 'completed' } });
    await waitFor(()=> expect(select).toHaveValue('completed'));
    const badge = screen.getByTestId('appointment-status-badge-1');
    expect(badge).toHaveAttribute('data-status','completed');
    expect(updateAppointmentMock).toHaveBeenCalledWith(1, { status:'completed' });
  expect(invalidateSpy).toHaveBeenCalledWith('appointments');
  });

  it('highlights search term in patient and doctor names', async () => {
    render(<AppointmentsPage />);
    const search = screen.getByLabelText('Search');
    fireEvent.change(search, { target: { value: 'Pat' } });
    await waitFor(()=> {
      const marks = screen.getAllByLabelText('highlighted search term');
      expect(marks.length).toBeGreaterThan(0);
    });
  });
});
