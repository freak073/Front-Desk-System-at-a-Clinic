import React, { act } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthContext } from '../../../../context/AuthContext';
import QueuePage from '../page';
import * as queueService from '../queue.service';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

// Mock the entire queueService module
jest.mock('../queue.service', () => ({
  fetchCurrentQueue: jest.fn(),
  fetchPatients: jest.fn(),
  addToQueue: jest.fn(),
  updateQueueEntryStatus: jest.fn(),
  removeFromQueue: jest.fn(),
  searchPatients: jest.fn(),
}));

const mockUser = {
  id: 1,
  username: 'frontdesk',
  role: 'front_desk' as const,
  token: 'mocktoken',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockQueueEntries = [
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

const mockPatients = [
  {
    id: 1,
    name: 'John Doe',
    medicalRecordNumber: 'MRN001',
    contactInfo: '',
    queueEntries: [],
    appointments: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Jane Smith',
    medicalRecordNumber: 'MRN002',
    contactInfo: '',
    queueEntries: [],
    appointments: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

afterEach(() => {
  jest.resetAllMocks();
});

describe('QueuePage', () => {
  it('renders queue management page with loading state', async () => {
    // Create a promise that resolves after a short delay to simulate network request
    const delayedPromise = () => new Promise(resolve => setTimeout(() => resolve([]), 100));
    
    (queueService.fetchCurrentQueue as jest.Mock).mockImplementation(delayedPromise);
    (queueService.fetchPatients as jest.Mock).mockImplementation(delayedPromise);

    await act(async () => {
      render(
        <AuthContext.Provider
          value={{
            user: mockUser,
            token: mockUser.token,
            loading: false,
            error: null,
            login: jest.fn(),
            logout: jest.fn(),
            refreshToken: jest.fn(),
          }}
        >
          <QueuePage />
        </AuthContext.Provider>
      );
    });

    expect(screen.getByText('Queue Management')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Add to Queue/i })).toBeInTheDocument();

    // Wait for loading state to appear
    await waitFor(() => {
      expect(screen.getByText('Loading queue entries...')).toBeInTheDocument();
    });
  });

  it('displays queue entries when loaded', async () => {
    (queueService.fetchCurrentQueue as jest.Mock).mockResolvedValue(mockQueueEntries);
    (queueService.fetchPatients as jest.Mock).mockResolvedValue(mockPatients);

    await act(async () => {
      render(
        <AuthContext.Provider
          value={{
            user: mockUser,
            token: mockUser.token,
            loading: false,
            error: null,
            login: jest.fn(),
            logout: jest.fn(),
            refreshToken: jest.fn(),
          }}
        >
          <QueuePage />
        </AuthContext.Provider>
      );
    });

    // Wait for data to load and check for first entry
    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    // Check that queue entries are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('MRN001')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    
    // Check for status badge specifically (find the one in the table, not in dropdowns)
    const statusBadges = screen.getAllByText('Waiting');
    // Find the one that's in a table cell with the specific class
    const tableStatusBadge = Array.from(statusBadges).find(badge => 
      badge.classList.contains('px-2') && 
      badge.closest('td') !== null
    );
    expect(tableStatusBadge).toBeInTheDocument();

    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('MRN002')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('5 min')).toBeInTheDocument();
  });

  it('filters queue entries by status', async () => {
    (queueService.fetchCurrentQueue as jest.Mock).mockResolvedValue(mockQueueEntries);
    (queueService.fetchPatients as jest.Mock).mockResolvedValue(mockPatients);

    await act(async () => {
      render(
        <AuthContext.Provider
          value={{
            user: mockUser,
            token: mockUser.token,
            loading: false,
            error: null,
            login: jest.fn(),
            logout: jest.fn(),
            refreshToken: jest.fn(),
          }}
        >
          <QueuePage />
        </AuthContext.Provider>
      );
    });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    // Check that both entries are displayed initially
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Filter by "waiting" status (both should still show since both are waiting)
    // Get the specific status filter dropdown by finding the select with "All Statuses" option
    const statusFilterSelects = screen.getAllByRole('combobox');
    // The first one should be the status filter (the one in the search/filter section)
    const statusFilter = statusFilterSelects[0];
    fireEvent.change(statusFilter, { target: { value: 'waiting' } });

    // Both entries should still be visible
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Filter by "completed" status (none should show)
    fireEvent.change(statusFilter, { target: { value: 'completed' } });

    // Check for no entries message
    await waitFor(() => {
      expect(screen.getByText('No patients in queue')).toBeInTheDocument();
    });
  });

  it('opens add to queue modal', async () => {
    (queueService.fetchCurrentQueue as jest.Mock).mockResolvedValue([]);
    (queueService.fetchPatients as jest.Mock).mockResolvedValue(mockPatients);

    await act(async () => {
      render(
        <AuthContext.Provider
          value={{
            user: mockUser,
            token: mockUser.token,
            loading: false,
            error: null,
            login: jest.fn(),
            logout: jest.fn(),
            refreshToken: jest.fn(),
          }}
        >
          <QueuePage />
        </AuthContext.Provider>
      );
    });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('No patients in queue')).toBeInTheDocument();
    });

    // Click "Add to Queue" button using more specific selector
    const addButton = screen.getByRole('button', { name: /\+ Add to Queue/i });
    fireEvent.click(addButton);

    // Check that modal is opened
    expect(screen.getByText('Add Patient to Queue')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name or medical record number')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    (queueService.fetchCurrentQueue as jest.Mock).mockResolvedValue(mockQueueEntries);
    (queueService.fetchPatients as jest.Mock).mockResolvedValue(mockPatients);

    await act(async () => {
      render(
        <AuthContext.Provider
          value={{
            user: mockUser,
            token: mockUser.token,
            loading: false,
            error: null,
            login: jest.fn(),
            logout: jest.fn(),
            refreshToken: jest.fn(),
          }}
        >
          <QueuePage />
        </AuthContext.Provider>
      );
    });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Search for "John"
    const searchInput = screen.getByPlaceholderText('Search patients by name or medical record number...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // Wait for the component to re-render with filtered results
    await waitFor(() => {
      // Check that John Doe is displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Check that Jane Smith is not displayed in the table
    // We'll use queryAllByText and filter to only those in table rows
    const janeSmithElements = screen.queryAllByText('Jane Smith');
    const janeSmithInTable = janeSmithElements.find(el =>
      el.closest('tbody') !== null
    );
    
    // If janeSmithInTable is undefined, it means there are no Jane Smith elements in the table,
    // which is exactly what we want. Otherwise, if it exists, it should not be in the document.
    if (janeSmithInTable !== undefined) {
      expect(janeSmithInTable).not.toBeInTheDocument();
    }
    // If janeSmithInTable is undefined, the test implicitly passes since Jane Smith is not in the table
  });

  it('shows error message when loading fails', async () => {
    (queueService.fetchCurrentQueue as jest.Mock).mockRejectedValue(new Error('Failed to load'));
    (queueService.fetchPatients as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      render(
        <AuthContext.Provider
          value={{
            user: mockUser,
            token: mockUser.token,
            loading: false,
            error: null,
            login: jest.fn(),
            logout: jest.fn(),
            refreshToken: jest.fn(),
          }}
        >
          <QueuePage />
        </AuthContext.Provider>
      );
    });

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load queue entries')).toBeInTheDocument();
    });
  });
});
