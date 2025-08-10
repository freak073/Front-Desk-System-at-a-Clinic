import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QueueManagementPage from '../page';

const dc = <T,>(v:T):T => JSON.parse(JSON.stringify(v));
const baseEntry = { id:1, patientId:1, patient:{ id:1, name:'Alice', createdAt:'', updatedAt:'' }, status:'waiting', priority:'normal', queueNumber:1, arrivalTime:'2025-08-10T09:00:00.000Z', estimatedWaitTime:10, createdAt:'', updatedAt:'' };
let logicalQueue = [ dc(baseEntry) ];

const invalidateSpy = jest.fn();

jest.mock('react-query', () => ({
  ...jest.requireActual('react-query'),
  useQueryClient: () => ({ invalidateQueries: invalidateSpy })
}));

jest.mock('../../../../context/AuthContext', () => ({ useAuth: () => ({}) }));

const updateMock = jest.fn(async () => ({}));

jest.mock('../queue.service', () => ({
  addToQueue: jest.fn(),
  updateQueueEntryStatus: (...args:any[]) => (updateMock as any)(...args),
  removeFromQueue: jest.fn(),
  fetchPatients: async () => [{ id:1, name:'Alice', createdAt:'', updatedAt:'' }],
  searchPatients: async () => [{ id:1, name:'Alice', createdAt:'', updatedAt:'' }]
}));

jest.mock('../../../hooks/useRealTimeUpdates', () => ({
  useQueueUpdates: () => ({ data: { data: { data: logicalQueue, meta: { total: logicalQueue.length }}}, isLoading:false, isError:false, error:null, refetch: jest.fn() }),
  useNotifications: () => ({ showSuccess: jest.fn(), showError: jest.fn() })
}));

describe('Queue cache invalidation', () => {
  beforeEach(()=> { logicalQueue = [ dc(baseEntry) ]; updateMock.mockClear(); invalidateSpy.mockClear(); });
  it('invalidates queue cache on status change', async () => {
    render(<QueueManagementPage />);
    const select = await screen.findByLabelText('Update status');
    fireEvent.change(select, { target: { value: 'completed' } });
    await waitFor(()=> expect(updateMock).toHaveBeenCalled());
    expect(invalidateSpy).toHaveBeenCalledWith('queue');
  });
});
