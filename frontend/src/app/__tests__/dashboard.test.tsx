import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../dashboard/page';
import NavigationTabs from '../components/NavigationTabs';
import { useAuth } from '../../context/AuthContext';

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
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
    });
  });

  it('renders dashboard page with welcome message', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Front Desk Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, testuser. Here\'s what\'s happening today.')).toBeInTheDocument();
  });

  it('renders navigation tabs', () => {
    render(<NavigationTabs />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Queue')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
    expect(screen.getByText('Doctors')).toBeInTheDocument();
    expect(screen.getByText('Patients')).toBeInTheDocument();
  });
});
