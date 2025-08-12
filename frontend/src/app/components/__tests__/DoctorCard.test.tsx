import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DoctorCard from '../DoctorCard';
import { Doctor } from '../../../types';

// Mock the appointments service
jest.mock('../../dashboard/appointments/appointments.service', () => ({
  fetchDoctorAvailability: jest.fn().mockResolvedValue({ nextAvailableTime: '2024-01-01T10:00:00Z' })
}));

const mockDoctor: Doctor = {
  id: 1,
  name: 'Dr. John Smith',
  specialization: 'Cardiology',
  gender: 'male',
  location: 'Room 101',
  status: 'available',
  availabilitySchedule: JSON.stringify({
    monday: { start: '09:00', end: '17:00' },
    tuesday: { start: '09:00', end: '17:00' },
    wednesday: { start: '09:00', end: '17:00' },
    thursday: { start: '09:00', end: '17:00' },
    friday: { start: '09:00', end: '17:00' },
    saturday: { start: '09:00', end: '13:00' },
    sunday: { start: 'off', end: 'off' }
  }),
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockProps = {
  doctor: mockDoctor,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onViewSchedule: jest.fn()
};

describe('DoctorCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders doctor information correctly', () => {
    render(<DoctorCard {...mockProps} />);
    
    expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
    expect(screen.getByText('Room 101')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('displays correct status badge color for available doctor', () => {
    render(<DoctorCard {...mockProps} />);
    
    const statusBadge = screen.getByText('Available');
    expect(statusBadge).toHaveClass('bg-green-600/20', 'text-green-300', 'border-green-700/40');
  });

  it('displays correct status badge color for busy doctor', () => {
    const busyDoctor = { ...mockDoctor, status: 'busy' as const };
    render(<DoctorCard {...mockProps} doctor={busyDoctor} />);
    
    const statusBadge = screen.getByText('Busy');
    expect(statusBadge).toHaveClass('bg-yellow-600/20', 'text-yellow-300', 'border-yellow-700/40');
  });

  it('displays correct status badge color for off duty doctor', () => {
    const offDutyDoctor = { ...mockDoctor, status: 'off_duty' as const };
    render(<DoctorCard {...mockProps} doctor={offDutyDoctor} />);
    
    const statusBadge = screen.getByText('Off Duty');
    expect(statusBadge).toHaveClass('bg-red-600/20', 'text-red-300', 'border-red-700/40');
  });

  it('calls onViewSchedule when View Schedule button is clicked', () => {
    render(<DoctorCard {...mockProps} />);
    
    const viewScheduleButton = screen.getByText('View Schedule');
    fireEvent.click(viewScheduleButton);
    
    expect(mockProps.onViewSchedule).toHaveBeenCalledWith(1);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<DoctorCard {...mockProps} />);
    
    const editButton = screen.getByTitle('Edit Doctor');
    fireEvent.click(editButton);
    
    expect(mockProps.onEdit).toHaveBeenCalledWith(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<DoctorCard {...mockProps} />);
    
    const deleteButton = screen.getByTitle('Delete Doctor');
    fireEvent.click(deleteButton);
    
    expect(mockProps.onDelete).toHaveBeenCalledWith(1);
  });

  it('displays next available time when fetched', async () => {
    render(<DoctorCard {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Next available: 10:00/)).toBeInTheDocument();
    });
  });

  it('displays "Now" when no next available time is provided', async () => {
    const { fetchDoctorAvailability } = require('../../dashboard/appointments/appointments.service');
    fetchDoctorAvailability.mockResolvedValueOnce({ nextAvailableTime: null });
    
    render(<DoctorCard {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Next available: Now/)).toBeInTheDocument();
    });
  });

  it('handles availability fetch error gracefully', async () => {
    const { fetchDoctorAvailability } = require('../../dashboard/appointments/appointments.service');
    fetchDoctorAvailability.mockRejectedValueOnce(new Error('Network error'));
    
    render(<DoctorCard {...mockProps} />);
    
    // Should still render the card without crashing
    expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
  });
});