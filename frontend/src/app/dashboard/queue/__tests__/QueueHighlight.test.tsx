import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QueueManagementPage from '../page';

// Deep clone utility
const dc = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const baseEntry = {
  id: 1,
  patientId: 1,
  patient: { id:1, name: 'Alice Johnson', createdAt:'', updatedAt:'' },
  status: 'waiting',
  priority: 'normal',
  queueNumber: 1,
  arrivalTime: '2025-08-10T09:00:00.000Z',
  estimatedWaitTime: 15,
  createdAt: '',
  updatedAt: ''
};

jest.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id:1, role:'admin' }, token:'token', loading:false, error:null, login:jest.fn(), logout:jest.fn(), refreshToken:jest.fn() }),
  AuthProvider: ({children}: any) => children
}));

let logicalQueue = [ dc(baseEntry) ];
const realTimeWrapper: any = {
  data: { data: { data: logicalQueue, meta: { total: 1 } } },
  isLoading: false,
  isError: false,
  error: null,
  refetch: jest.fn()
};

jest.mock('../../../hooks/useRealTimeUpdates', () => ({
  useQueueUpdates: () => {
    realTimeWrapper.data.data.data = logicalQueue.map(e => dc(e));
    realTimeWrapper.data.data.meta.total = logicalQueue.length;
    return realTimeWrapper;
  },
  useNotifications: () => ({ showSuccess: jest.fn(), showError: jest.fn() })
}));

jest.mock('../queue.service', () => ({
  addToQueue: jest.fn(),
  updateQueueEntryStatus: jest.fn(),
  removeFromQueue: jest.fn(),
  fetchPatients: async () => dc([{ id:1, name:'Alice Johnson', createdAt:'', updatedAt:'' }]),
  searchPatients: async () => dc([{ id:1, name:'Alice Johnson', createdAt:'', updatedAt:'' }])
}));

describe('Queue highlight search term', () => {
  beforeEach(()=> {
    logicalQueue = [ dc(baseEntry) ];
  });

  it('highlights matching patient name', async () => {
    render(<QueueManagementPage />);
    const search = screen.getByLabelText('Search Patient');
    fireEvent.change(search, { target: { value: 'Alice' } });
    await waitFor(()=> {
      const marks = screen.getAllByLabelText('highlighted search term');
      expect(marks.length).toBeGreaterThan(0);
    });
  });
});
