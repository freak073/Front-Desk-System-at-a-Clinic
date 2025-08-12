import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';
import DashboardOverview from '../DashboardOverview';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

const mockStats = {
  queueCount: 5,
  todayAppointments: 12,
  availableDoctors: 3,
  averageWaitTime: 15,
};

describe('DashboardOverview', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders dashboard stats correctly', () => {
    render(<DashboardOverview stats={mockStats} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    render(<DashboardOverview stats={mockStats} />);
    
    expect(screen.getByText('Add Patient to Queue')).toBeInTheDocument();
    expect(screen.getByText('Schedule Appointment')).toBeInTheDocument();
    expect(screen.getByText('Manage Doctors')).toBeInTheDocument();
  });

  it('navigates to queue page when "Add Patient to Queue" is clicked', async () => {
    render(<DashboardOverview stats={mockStats} />);
    
    const addToQueueButton = screen.getByText('Add Patient to Queue');
    fireEvent.click(addToQueueButton);
    
    // Wait for the setTimeout to complete
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard/queue');
  });

  it('navigates to appointments page when "Schedule Appointment" is clicked', async () => {
    render(<DashboardOverview stats={mockStats} />);
    
    const scheduleButton = screen.getByText('Schedule Appointment');
    fireEvent.click(scheduleButton);
    
    // Wait for the setTimeout to complete
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard/appointments');
  });

  it('navigates to doctors page when "Manage Doctors" is clicked', async () => {
    render(<DashboardOverview stats={mockStats} />);
    
    const manageDoctorsButton = screen.getByText('Manage Doctors');
    fireEvent.click(manageDoctorsButton);
    
    // Wait for the setTimeout to complete
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard/doctors');
  });

  it('makes stat cards clickable for navigation', async () => {
    render(<DashboardOverview stats={mockStats} />);
    
    // Click on the queue stat card
    const queueCard = screen.getByText('Patients in Queue').closest('div');
    if (queueCard) {
      fireEvent.click(queueCard);
      
      // Wait for the setTimeout to complete
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard/queue');
    }
  });

  it('handles keyboard navigation for stat cards', async () => {
    render(<DashboardOverview stats={mockStats} />);
    
    // Find the queue stat card
    const queueCard = screen.getByText('Patients in Queue').closest('div');
    if (queueCard) {
      fireEvent.keyDown(queueCard, { key: 'Enter' });
      
      // Wait for the setTimeout to complete
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard/queue');
    }
  });

  it('shows loading state correctly', () => {
    render(<DashboardOverview stats={mockStats} isLoading={true} />);
    
    // Should show skeleton loaders
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements).toHaveLength(4);
  });

  it('has proper accessibility attributes', () => {
    render(<DashboardOverview stats={mockStats} />);
    
    const addToQueueButton = screen.getByLabelText('Add Patient to Queue');
    expect(addToQueueButton).toBeInTheDocument();
    
    const scheduleButton = screen.getByLabelText('Schedule Appointment');
    expect(scheduleButton).toBeInTheDocument();
    
    const manageDoctorsButton = screen.getByLabelText('Manage Doctors');
    expect(manageDoctorsButton).toBeInTheDocument();
  });
});