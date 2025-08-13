jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}));
// Mock js-cookie
jest.mock('js-cookie', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  }
}));
// Mock react-query to avoid needing a QueryClientProvider in these auth flow tests
jest.mock('react-query', () => ({
  useQuery: jest.fn(() => ({
    data: { data: { queueCount: 5, todayAppointments: 10, availableDoctors: 3, averageWaitTime: 15 } },
    isFetching: false,
    isLoading: false,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
  })),
}));
import '@testing-library/jest-dom';

import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import LoginPage from '../login/page';
import DashboardPage from '../dashboard/page';

// Valid mock JWT (exp in far future, role front_desk, id 1)
const validMockJWT =
  'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQ3OTk5OTk5OTksInVzZXJuYW1lIjoidmFsaWR1c2VyIiwicm9sZSI6ImZyb250X2Rlc2siLCJpZCI6MX0.signature';

// Mock user for tests
const mockUser = {
  id: 1,
  username: 'frontdesk',
  role: 'front_desk',
  token: validMockJWT,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

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
  // Simulate 401 style error to trigger specific AuthContext error path
  const error: any = new Error('Unauthorized');
  error.response = { status: 401, data: { message: 'Invalid username or password' } };
  return Promise.reject(error);
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
    get: jest.fn((url) => {
      if (url === '/dashboard/stats') {
        return Promise.resolve({
          queueCount: 5,
          todayAppointments: 10,
          availableDoctors: 3,
          averageWaitTime: 15
        });
      }
      return Promise.resolve({ success: false });
    })
  },
}));

// Helper component to simulate navigation after login
const AuthFlowTest = () => {
  const { user } = useAuth();
  return user ? <DashboardPage /> : <LoginPage />;
};

describe('Auth Flow', () => {
  it('shows error on invalid login', async () => {
    act(() => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your username'), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByText(/Invalid username or password/)).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('logs in with valid credentials and shows dashboard', async () => {
    act(() => {
      render(
        <AuthProvider>
          <AuthFlowTest />
        </AuthProvider>
      );
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your username'), { target: { value: 'validuser' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'validpass' } });
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });
  });

  it('shows dashboard for authenticated user', async () => {
    // Mock Cookies to return our token so AuthProvider initializes with a user
    const mockCookies = require('js-cookie');
    mockCookies.default.get.mockReturnValue(validMockJWT);
    
    // Reset loading state for all tests
    const mockApiService = require('../../lib/api').apiService;
    mockApiService.post.mockImplementation((url: string, data: any) => {
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
    });
    
    // Simulate authenticated state
    const TestDashboard = () => {
      const { user } = useAuth();
      return user ? <DashboardPage /> : <div>Not Authenticated</div>;
    };
    
    act(() => {
      render(
        <AuthProvider>
          <TestDashboard />
        </AuthProvider>
      );
    });
    
    // Wait for the component to render with authenticated user
    await waitFor(() => {
      expect(screen.queryByText('Not Authenticated')).not.toBeInTheDocument();
    });
    
    // Should show dashboard content
  expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
  });
});
