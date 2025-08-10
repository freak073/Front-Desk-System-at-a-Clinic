import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { AuthContext } from '../../../../context/AuthContext';
import QueuePage from '../page';
import '@testing-library/jest-dom';
// Mock react-query
jest.mock('react-query', () => ({
  useQuery: jest.fn(() => ({ data: { data: { data: [], meta: { total:0 } } }, isLoading:false, isError:false, isFetching:false })),
  useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn(), setQueryData: jest.fn() }))
}));
// Mock notifications (useToast)
jest.mock('../../../components/ToastProvider', () => ({
  useToast: () => ({ success: jest.fn(), error: jest.fn(), info: jest.fn() })
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

// Mock queue service (only methods used via direct calls inside component)
jest.mock('../queue.service', () => ({
  addToQueue: jest.fn(),
  updateQueueEntryStatus: jest.fn(),
  removeFromQueue: jest.fn(),
  fetchPatients: jest.fn().mockResolvedValue([]),
  searchPatients: jest.fn().mockResolvedValue([])
}));

// Mocks for real-time hook & notifications
const mockUseQueueUpdates = jest.fn();
const mockRefetch = jest.fn();
jest.mock('../../../hooks/useRealTimeUpdates', () => ({
  useQueueUpdates: (...args: any[]) => mockUseQueueUpdates(...args),
  useNotifications: () => ({ showSuccess: jest.fn(), showError: jest.fn() })
}));

const mockUser = {
  id: 1,
  username: 'frontdesk',
  role: 'front_desk' as const,
  token: 'mocktoken',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const baseQueueEntries = [
  {
    id: 1,
    patientId: 1,
    queueNumber: 1,
    status: 'waiting' as const,
    priority: 'normal' as const,
    arrivalTime: '2025-01-01T10:00:00Z',
    estimatedWaitTime: 15,
    patient: {
      id: 1,
      name: 'John Doe',
      medicalRecordNumber: 'MRN001',
      contactInfo: '',
      queueEntries: [],
      appointments: [],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 2,
    patientId: 2,
    queueNumber: 2,
    status: 'waiting' as const,
    priority: 'urgent' as const,
    arrivalTime: '2025-01-01T10:05:00Z',
    estimatedWaitTime: 5,
    patient: {
      id: 2,
      name: 'Jane Smith',
      medicalRecordNumber: 'MRN002',
      contactInfo: '',
      queueEntries: [],
      appointments: [],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    createdAt: '2025-01-01T10:05:00Z',
    updatedAt: '2025-01-01T10:05:00Z',
  },
];

afterEach(() => { jest.clearAllMocks(); });

describe('QueuePage', () => {
  it('renders queue management page with empty state', async () => {
    mockUseQueueUpdates.mockReturnValue({
      data: { data: { data: [], meta: { total: 0 } } },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch
    });

    await act(async () => {
      render(
        <AuthContext.Provider value={{ user: mockUser, token: mockUser.token, loading: false, error: null, login: jest.fn(), logout: jest.fn(), refreshToken: jest.fn() }}>
          <QueuePage />
        </AuthContext.Provider>
      );
    });

    expect(screen.getByText('Queue Management')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Add Patient to Queue/i })).toBeInTheDocument();
    expect(screen.getByText('No patients in queue')).toBeInTheDocument();
  });

  it('displays queue entries when loaded', async () => {
    mockUseQueueUpdates.mockReturnValue({
      data: { data: { data: baseQueueEntries, meta: { total: baseQueueEntries.length } } },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch
    });
    await act(async () => {
      render(<AuthContext.Provider value={{ user: mockUser, token: mockUser.token, loading: false, error: null, login: jest.fn(), logout: jest.fn(), refreshToken: jest.fn() }}><QueuePage /></AuthContext.Provider>);
    });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters queue entries by status', async () => {
    mockUseQueueUpdates.mockReturnValue({
      data: { data: { data: baseQueueEntries, meta: { total: baseQueueEntries.length } } },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch
    });
    await act(async () => {
      render(<AuthContext.Provider value={{ user: mockUser, token: mockUser.token, loading: false, error: null, login: jest.fn(), logout: jest.fn(), refreshToken: jest.fn() }}><QueuePage /></AuthContext.Provider>);
    });
    // initial
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.change(statusSelect, { target: { value: 'completed' } });
  await waitFor(()=> { expect(screen.getByText('No patients match your search criteria')).toBeInTheDocument(); });
  });

  it('opens add to queue modal', async () => {
    mockUseQueueUpdates.mockReturnValue({
      data: { data: { data: [], meta: { total: 0 } } },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch
    });
    await act(async () => {
      render(<AuthContext.Provider value={{ user: mockUser, token: mockUser.token, loading: false, error: null, login: jest.fn(), logout: jest.fn(), refreshToken: jest.fn() }}><QueuePage /></AuthContext.Provider>);
    });
    const addButton = screen.getByRole('button', { name: /\+ Add Patient to Queue/i });
    fireEvent.click(addButton);
    expect(screen.getByText('Add Patient to Queue')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    mockUseQueueUpdates.mockReturnValue({
      data: { data: { data: baseQueueEntries, meta: { total: baseQueueEntries.length } } },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch
    });
    await act(async () => {
      render(<AuthContext.Provider value={{ user: mockUser, token: mockUser.token, loading: false, error: null, login: jest.fn(), logout: jest.fn(), refreshToken: jest.fn() }}><QueuePage /></AuthContext.Provider>);
    });
    const searchInput = screen.getByPlaceholderText('Search by patient name');
    fireEvent.change(searchInput, { target: { value: 'John' } });
    await waitFor(()=> { expect(screen.getByText('John Doe')).toBeInTheDocument(); });
  });

  it('shows error message when loading fails', async () => {
    mockUseQueueUpdates.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Load failure'),
      refetch: mockRefetch
    });
    await act(async () => {
      render(<AuthContext.Provider value={{ user: mockUser, token: mockUser.token, loading: false, error: null, login: jest.fn(), logout: jest.fn(), refreshToken: jest.fn() }}><QueuePage /></AuthContext.Provider>);
    });
    await waitFor(()=> { expect(screen.getByText('Error Loading Queue')).toBeInTheDocument(); });
  });
});
