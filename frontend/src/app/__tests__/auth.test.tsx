jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}));
import '@testing-library/jest-dom';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import LoginPage from '../login/page';
import DashboardPage from '../dashboard/page';
import React from 'react';

// Valid mock JWT (exp in far future, role front_desk, id 1)
const validMockJWT =
  'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQ3OTk5OTk5OTksInVzZXJuYW1lIjoidmFsaWR1c2VyIiwicm9sZSI6ImZyb250X2Rlc2siLCJpZCI6MX0.signature';

// Mock apiService for login/logout
jest.mock('../../lib/api', () => ({
  apiService: {
    post: jest.fn((url, data) => {
      if (url === '/auth/login') {
        if (data.username === 'validuser' && data.password === 'validpass') {
          return Promise.resolve({
            success: true,
            data: {
              user: { id: 1, username: 'validuser', role: 'front_desk', createdAt: '', updatedAt: '' },
              token: validMockJWT,
            },
          });
        }
        return Promise.resolve({ success: false, message: 'Invalid credentials' });
      }
      if (url === '/auth/logout') {
        return Promise.resolve({ success: true });
      }
      if (url === '/auth/refresh') {
        return Promise.resolve({
          success: true,
          data: { token: validMockJWT },
        });
      }
      return Promise.resolve({ success: false });
    }),
  },
}));

// Helper component to simulate navigation after login
const AuthFlowTest = () => {
  const { user } = useAuth();
  return user ? <DashboardPage /> : <LoginPage />;
};

describe('Auth Flow', () => {
  it('shows error on invalid login', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    fireEvent.change(screen.getByPlaceholderText('Enter your username'), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument();
    });
  });

  it('logs in with valid credentials and shows dashboard', async () => {
    render(
      <AuthProvider>
        <AuthFlowTest />
      </AuthProvider>
    );
    fireEvent.change(screen.getByPlaceholderText('Enter your username'), { target: { value: 'validuser' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'validpass' } });
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByText(/Clinic Front Desk/)).toBeInTheDocument();
      expect(screen.getByText(/Select a tab to manage queues, appointments, doctors, or patients./)).toBeInTheDocument();
    });
  });

  it('shows dashboard for authenticated user', async () => {
    // Simulate authenticated state
    const TestDashboard = () => {
      const { user } = useAuth();
      return user ? <DashboardPage /> : <div>Not Authenticated</div>;
    };
    render(
      <AuthProvider>
        <TestDashboard />
      </AuthProvider>
    );
    // Should show dashboard header and content
    await waitFor(() => {
      expect(screen.getByText(/Clinic Front Desk/)).toBeInTheDocument();
      expect(screen.getByText(/Select a tab to manage queues, appointments, doctors, or patients./)).toBeInTheDocument();
    });
  });
});
