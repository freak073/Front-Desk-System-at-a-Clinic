import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock react-query's useQueryClient before importing the page to avoid needing a provider
jest.mock('react-query', () => {
  const actual = jest.requireActual('react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: jest.fn() })
  };
});

import QueueManagementPage from '../page';

const dc = <T,>(v:T):T => JSON.parse(JSON.stringify(v));

const baseEntry = { id:1, patientId:1, patient:{ id:1, name:'Alice', createdAt:'', updatedAt:'' }, status:'waiting', priority:'normal', queueNumber:1, arrivalTime:'2025-08-10T09:00:00.000Z', estimatedWaitTime:10, createdAt:'', updatedAt:'' };
let logicalQueue = [ dc(baseEntry) ];

jest.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({ user:{id:1, role:'admin'}, token:'t', loading:false, error:null, login:jest.fn(), logout:jest.fn(), refreshToken:jest.fn() }),
  AuthProvider: ({children}: any) => children
}));

let succeed = true;
const updateMock = jest.fn(async () => { if(!succeed) throw new Error('fail'); return {}; });

jest.mock('../queue.service', () => {
  const mod: any = {
    addToQueue: jest.fn(),
    updateQueueEntryStatus: (...args: any[]) => (updateMock as any)(...args),
    removeFromQueue: jest.fn(),
    fetchPatients: async () => dc([{ id:1, name:'Alice', createdAt:'', updatedAt:'' }]),
    searchPatients: async () => dc([{ id:1, name:'Alice', createdAt:'', updatedAt:'' }])
  };
  return mod;
});

jest.mock('../../../hooks/useRealTimeUpdates', () => ({
  useQueueUpdates: () => ({ data: { data: { data: logicalQueue, meta: { total: logicalQueue.length }}}, isLoading:false, isError:false, error:null, refetch: jest.fn() }),
  useNotifications: () => ({ showSuccess: jest.fn(), showError: jest.fn() })
}));

describe('Queue optimistic status', () => {
  beforeEach(()=> { logicalQueue = [ dc(baseEntry) ]; succeed = true; updateMock.mockClear(); });
  it('optimistically updates and keeps new status on success', async () => {
    render(<QueueManagementPage />);
    const select = await screen.findByLabelText('Update status');
    fireEvent.change(select, { target: { value: 'completed' } });
    await waitFor(()=> expect(select).toHaveValue('completed'));
  });
  it('rolls back on failure', async () => {
    succeed = false;
    render(<QueueManagementPage />);
    const select = await screen.findByLabelText('Update status');
    fireEvent.change(select, { target: { value: 'completed' } });
    // rollback should restore waiting
    await waitFor(()=> expect(select).toHaveValue('waiting'));
  });
});
