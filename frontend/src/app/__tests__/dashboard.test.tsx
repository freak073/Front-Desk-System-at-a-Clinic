import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthContext } from '../../context/AuthContext';
import NavigationTabs from '../components/NavigationTabs';
import Header from '../components/Header';
import DashboardPage from '../dashboard/page';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/dashboard',
}));

const mockUser = {
  id: 1,
  username: 'frontdesk',
  role: 'front_desk' as const,
  token: 'mocktoken',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

jest.mock('../dashboard/dashboard.service', () => ({
  fetchDashboardStats: jest.fn().mockResolvedValue({
    queueCount: 5,
    todayAppointments: 10,
    availableDoctors: 3,
    averageWaitTime: 15
  })
}));

describe('DashboardPage', () => {
  it('renders Header and NavigationTabs with dashboard stats', async () => {
    act(() => {
      render(
        <AuthContext.Provider value={{
          user: mockUser,
          token: mockUser.token,
          loading: false,
          error: null,
          login: jest.fn(),
          logout: jest.fn(),
          refreshToken: jest.fn(),
        }}>
          <DashboardPage />
        </AuthContext.Provider>
      );
    });

    expect(screen.getByText('Clinic Front Desk')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Queue count
      expect(screen.getByText('10')).toBeInTheDocument(); // Today's appointments
      expect(screen.getByText('3')).toBeInTheDocument(); // Available doctors
      expect(screen.getByText('15m')).toBeInTheDocument(); // Average wait time
    });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome, frontdesk!')).toBeInTheDocument();
  });

  it('redirects to login if user is not present', () => {
    act(() => {
      render(
        <AuthContext.Provider value={{
          user: null,
          token: null,
          loading: false,
          error: null,
          login: jest.fn(),
          logout: jest.fn(),
          refreshToken: jest.fn(),
        }}>
          <NavigationTabs pathname="/login" />
        </AuthContext.Provider>
      );
    });
    // Should not render dashboard content
    expect(screen.queryByText('Welcome,')).not.toBeInTheDocument();
  });
});
