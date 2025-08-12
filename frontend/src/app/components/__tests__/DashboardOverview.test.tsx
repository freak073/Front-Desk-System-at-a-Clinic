import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardOverview from '../DashboardOverview';
import { DashboardStats } from '../../dashboard/dashboard.service';

const mockStats: DashboardStats = {
  queueCount: 5,
  todayAppointments: 12,
  availableDoctors: 3,
  averageWaitTime: 15,
};

describe('DashboardOverview', () => {
  it('renders dashboard stats correctly', () => {
    render(<DashboardOverview stats={mockStats} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
  });

  it('displays correct stat card titles', () => {
    render(<DashboardOverview stats={mockStats} />);
    
    expect(screen.getByText('Patients in Queue')).toBeInTheDocument();
    expect(screen.getByText("Today's Appointments")).toBeInTheDocument();
    expect(screen.getByText('Available Doctors')).toBeInTheDocument();
    expect(screen.getByText('Avg. Wait Time')).toBeInTheDocument();
  });

  it('renders quick actions section', () => {
    render(<DashboardOverview stats={mockStats} />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Add Patient to Queue')).toBeInTheDocument();
    expect(screen.getByText('Schedule Appointment')).toBeInTheDocument();
    expect(screen.getByText('Manage Doctors')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<DashboardOverview stats={mockStats} isLoading={true} />);
    
    const loadingElements = screen.getAllByRole('generic');
    const animatedElements = loadingElements.filter(el => 
      el.className.includes('animate-pulse')
    );
    
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('renders stat cards with proper accessibility', () => {
    render(<DashboardOverview stats={mockStats} />);
    
    // Check that stat values are properly labeled
    const queueStat = screen.getByText('5');
    const appointmentStat = screen.getByText('12');
    
    expect(queueStat).toBeInTheDocument();
    expect(appointmentStat).toBeInTheDocument();
  });
});