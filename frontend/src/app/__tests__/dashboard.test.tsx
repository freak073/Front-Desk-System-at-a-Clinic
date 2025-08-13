import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../dashboard/page';
import { useAuth } from '../../context/AuthContext';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the real-time updates hook
jest.mock('../hooks/useRealTimeUpdates', () => ({
  useDashboardStatsUpdates: jest.fn(() => ({
    data: { 
      data: { 
        queueCount: 5, 
        todayAppointments: 12, 
        availableDoctors: 3, 
        averageWaitTime: 15 
      } 
    },
    isLoading: false,
    isError: false,
  })),
}));

// Mock the dashboard service
jest.mock('../dashboard/dashboard.service', () => ({
  fetchDashboardStats: jest.fn().mockResolvedValue({
    queueCount: 5,
    todayAppointments: 12,
    availableDoctors: 3,
    averageWaitTime: 15
  }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { username: 'testuser' },
      logout: jest.fn(),
    });
  });

  it('renders dashboard page with welcome message', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Front Desk Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, testuser. Here\'s what\'s happening today.')).toBeInTheDocument();
  });

  it('renders navigation tabs without home button on dashboard home page', () => {
    render(<DashboardPage />);
    
    // Navigation tabs should be present but without the home button
    expect(screen.queryByText('Dashboard Home')).not.toBeInTheDocument();
    expect(screen.getByText('Queue Management')).toBeInTheDocument();
    expect(screen.getByText('Appointment Management')).toBeInTheDocument();
    expect(screen.getByText('Doctor Management')).toBeInTheDocument();
  });

  it('displays dashboard statistics', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Patients in Queue')).toBeInTheDocument();
    expect(screen.getByText("Today's Appointments")).toBeInTheDocument();
    expect(screen.getByText('Available Doctors')).toBeInTheDocument();
    expect(screen.getByText('Avg. Wait Time')).toBeInTheDocument();
  });

  it('shows quick actions section', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Add Patient to Queue')).toBeInTheDocument();
    expect(screen.getByText('Schedule Appointment')).toBeInTheDocument();
    expect(screen.getByText('Manage Doctors')).toBeInTheDocument();
  });

  it('displays recent activity section', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('shows system status section', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('Database Connection')).toBeInTheDocument();
    expect(screen.getByText('API Status')).toBeInTheDocument();
  });

  it('handles user not being logged in', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      logout: jest.fn(),
    });

    render(<DashboardPage />);
    
    expect(screen.getByText('Front Desk Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Welcome back,')).not.toBeInTheDocument();
  });
});
