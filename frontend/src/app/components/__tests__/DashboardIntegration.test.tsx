import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';
import DashboardPage from '../../dashboard/page';
import { useAuth } from '../../../context/AuthContext';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock the useAuth hook
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the real-time updates hook
jest.mock('../../hooks/useRealTimeUpdates', () => ({
  useDashboardStatsUpdates: jest.fn(() => ({
    data: { 
      data: { 
        queueCount: 8, 
        todayAppointments: 15, 
        availableDoctors: 4, 
        averageWaitTime: 12 
      } 
    },
    isLoading: false,
    isError: false,
  })),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockLogout = jest.fn();

describe('Dashboard Integration', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);
    
    mockUseAuth.mockReturnValue({
      user: { username: 'frontdesk_user' },
      logout: mockLogout,
    } as any);
    
    mockPush.mockClear();
    mockLogout.mockClear();
  });

  it('renders complete dashboard with all components', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    
    render(<DashboardPage />);
    
    // Header components
    expect(screen.getByText('Clinic Front Desk')).toBeInTheDocument();
    expect(screen.getByText('frontdesk_user')).toBeInTheDocument();
    expect(screen.getByText('Front Desk Staff')).toBeInTheDocument();
    
    // Dashboard title and welcome
    expect(screen.getByText('Front Desk Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, frontdesk_user. Here\'s what\'s happening today.')).toBeInTheDocument();
    
    // Navigation tabs
    expect(screen.getByText('Queue Management')).toBeInTheDocument();
    expect(screen.getByText('Appointment Management')).toBeInTheDocument();
    expect(screen.getByText('Doctor Management')).toBeInTheDocument();
    
    // Dashboard overview stats
    expect(screen.getByText('8')).toBeInTheDocument(); // queueCount
    expect(screen.getByText('15')).toBeInTheDocument(); // todayAppointments
    expect(screen.getByText('4')).toBeInTheDocument(); // availableDoctors
    expect(screen.getByText('12 min')).toBeInTheDocument(); // averageWaitTime
    
    // Quick actions
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Add Patient to Queue')).toBeInTheDocument();
    expect(screen.getByText('Schedule Appointment')).toBeInTheDocument();
    expect(screen.getByText('Manage Doctors')).toBeInTheDocument();
    
    // Additional sections
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('System Status')).toBeInTheDocument();
  });

  it('handles navigation tab interactions correctly', () => {
    mockUsePathname.mockReturnValue('/dashboard/queue');
    
    render(<DashboardPage />);
    
    const queueTab = screen.getByRole('tab', { name: /queue management/i });
    const appointmentTab = screen.getByRole('tab', { name: /appointment management/i });
    const doctorTab = screen.getByRole('tab', { name: /doctor management/i });
    
    // Queue tab should be active
    expect(queueTab).toHaveAttribute('aria-selected', 'true');
    expect(appointmentTab).toHaveAttribute('aria-selected', 'false');
    expect(doctorTab).toHaveAttribute('aria-selected', 'false');
  });

  it('handles logout functionality', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    
    render(<DashboardPage />);
    
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('displays responsive design elements', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    
    render(<DashboardPage />);
    
    // Check for responsive navigation elements
    const queueFullName = screen.getByText('Queue Management');
    const queueShortName = screen.getByText('Queue');
    
    expect(queueFullName).toBeInTheDocument();
    expect(queueShortName).toBeInTheDocument();
    
    // Check for responsive user info
    const userInfo = screen.getByText('Front Desk Staff').closest('div');
    expect(userInfo).toHaveClass('hidden', 'sm:block');
  });

  it('handles different pathname states correctly', () => {
    // Test appointments path
    mockUsePathname.mockReturnValue('/dashboard/appointments');
    
    const { rerender } = render(<DashboardPage />);
    
    let appointmentTab = screen.getByRole('tab', { name: /appointment management/i });
    expect(appointmentTab).toHaveAttribute('aria-selected', 'true');
    
    // Test doctors path
    mockUsePathname.mockReturnValue('/dashboard/doctors');
    rerender(<DashboardPage />);
    
    let doctorTab = screen.getByRole('tab', { name: /doctor management/i });
    expect(doctorTab).toHaveAttribute('aria-selected', 'true');
  });

  it('handles user avatar display correctly', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    
    render(<DashboardPage />);
    
    // Should show first letter of username
    expect(screen.getByText('F')).toBeInTheDocument(); // First letter of 'frontdesk_user'
  });

  it('maintains session state during navigation', async () => {
    mockUsePathname.mockReturnValue('/dashboard/queue');
    
    render(<DashboardPage />);
    
    // Verify user session is maintained
    expect(screen.getByText('frontdesk_user')).toBeInTheDocument();
    
    // Simulate navigation to appointments
    mockUsePathname.mockReturnValue('/dashboard/appointments');
    
    // User info should still be present
    expect(screen.getByText('frontdesk_user')).toBeInTheDocument();
  });

  it('displays system status indicators', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    
    render(<DashboardPage />);
    
    expect(screen.getByText('Database Connection')).toBeInTheDocument();
    expect(screen.getByText('API Status')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('handles accessibility requirements', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    
    render(<DashboardPage />);
    
    // Check for proper ARIA attributes
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    
    tabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-selected');
    });
    
    // Check for proper header structure
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    // Check for logout button accessibility
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    expect(logoutButton).toHaveAttribute('aria-label', 'Log out');
  });
});