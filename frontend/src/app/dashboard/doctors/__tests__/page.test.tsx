import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DoctorManagementPage from '../page';
import { Doctor } from '../../../../types';

// Mock the auth context
jest.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'staff', role: 'staff' }
  })
}));

// Mock the appointments service
jest.mock('../../appointments/appointments.service', () => ({
  fetchDoctors: jest.fn(),
  createDoctor: jest.fn(),
  updateDoctor: jest.fn(),
  deleteDoctor: jest.fn(),
  filterDoctors: jest.fn(),
  fetchDoctorAvailability: jest.fn()
}));

const mockDoctors: Doctor[] = [
  {
    id: 1,
    name: 'Dr. John Smith',
    specialization: 'Cardiology',
    gender: 'male',
    location: 'Room 101',
    status: 'available',
    availabilitySchedule: '{}',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    name: 'Dr. Jane Doe',
    specialization: 'Neurology',
    gender: 'female',
    location: 'Room 102',
    status: 'busy',
    availabilitySchedule: '{}',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock Modal component
jest.mock('../../../components/Modal', () => {
  return function MockModal({ isOpen, children, title }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
      </div>
    );
  };
});

// Mock DoctorCard component
jest.mock('../../../components/DoctorCard', () => {
  return function MockDoctorCard({ doctor, onEdit, onDelete, onViewSchedule }: any) {
    return (
      <div data-testid={`doctor-card-${doctor.id}`}>
        <h3>{doctor.name}</h3>
        <p>{doctor.specialization}</p>
        <p>{doctor.location}</p>
        <span>{doctor.status}</span>
        <button onClick={() => onEdit(doctor.id)}>Edit</button>
        <button onClick={() => onDelete(doctor.id)}>Delete</button>
        <button onClick={() => onViewSchedule(doctor.id)}>View Schedule</button>
      </div>
    );
  };
});

describe('DoctorManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock implementations
    const { 
      fetchDoctors, 
      createDoctor, 
      updateDoctor, 
      deleteDoctor, 
      filterDoctors, 
      fetchDoctorAvailability 
    } = require('../../appointments/appointments.service');
    
    fetchDoctors.mockResolvedValue(mockDoctors);
    createDoctor.mockResolvedValue(mockDoctors[0]);
    updateDoctor.mockResolvedValue(mockDoctors[0]);
    deleteDoctor.mockResolvedValue(true);
    filterDoctors.mockResolvedValue(mockDoctors);
    fetchDoctorAvailability.mockResolvedValue({ nextAvailableTime: null });
  });

  it('renders the page title and add button', async () => {
    render(<DoctorManagementPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Doctor Management')).toBeInTheDocument();
      expect(screen.getByText('+ Add New Doctor')).toBeInTheDocument();
    });
  });

  it('displays doctors after loading', async () => {
    render(<DoctorManagementPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
    });
  });

  it('shows loading spinner initially', () => {
    render(<DoctorManagementPage />);
    
    expect(screen.getByText('Doctor Management')).toBeInTheDocument();
  });

  it('opens new doctor modal when add button is clicked', async () => {
    render(<DoctorManagementPage />);
    
    await waitFor(() => {
      expect(screen.getByText('+ Add New Doctor')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('+ Add New Doctor'));
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Add New Doctor')).toBeInTheDocument();
  });

  it('filters doctors by search term', async () => {
    render(<DoctorManagementPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search by name or specialization');
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    // Wait for debounced search
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('filters doctors by status', async () => {
    render(<DoctorManagementPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });
    
    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: 'available' } });
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });
  });

  it('clears all filters when clear button is clicked', async () => {
    render(<DoctorManagementPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });
    
    // Set some filters first
    const searchInput = screen.getByPlaceholderText('Search by name or specialization');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: 'available' } });
    
    // Clear filters
    fireEvent.click(screen.getByText('Clear Filters'));
    
    expect(searchInput).toHaveValue('');
    expect(statusSelect).toHaveValue('all');
  });

  it('opens edit modal when edit button is clicked', async () => {
    render(<DoctorManagementPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });
    
    const editButton = screen.getAllByText('Edit')[0];
    fireEvent.click(editButton);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Edit Doctor')).toBeInTheDocument();
  });

  it('opens schedule modal when view schedule button is clicked', async () => {
    render(<DoctorManagementPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });
    
    const viewScheduleButton = screen.getAllByText('View Schedule')[0];
    fireEvent.click(viewScheduleButton);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Dr. John Smith - Schedule')).toBeInTheDocument();
  });

  it('shows confirmation dialog when delete button is clicked', async () => {
    // Mock window.confirm
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(<DoctorManagementPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });
    
    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);
    
    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to delete Dr. Dr. John Smith? This action cannot be undone.'
    );
    
    confirmSpy.mockRestore();
  });

  it('displays no doctors message when list is empty', async () => {
    const { fetchDoctors } = require('../../appointments/appointments.service');
    fetchDoctors.mockResolvedValueOnce([]);
    
    render(<DoctorManagementPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/No doctors found/)).toBeInTheDocument();
    });
  });

  it('displays no results message when search returns empty', async () => {
    render(<DoctorManagementPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search by name or specialization');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    // Mock empty search results
    const { filterDoctors } = require('../../appointments/appointments.service');
    filterDoctors.mockResolvedValueOnce([]);
    
    await waitFor(() => {
      expect(screen.getByText('No doctors match your search criteria')).toBeInTheDocument();
    }, { timeout: 500 });
  });
});