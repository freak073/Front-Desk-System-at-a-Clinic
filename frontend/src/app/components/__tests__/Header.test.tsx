import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import { useAuth } from '../../../context/AuthContext';

// Mock the useAuth hook
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Header', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { username: 'testuser' },
      logout: mockLogout,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders header with user info', () => {
    render(<Header />);
    
    expect(screen.getByText('Clinic Front Desk')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Front Desk Staff')).toBeInTheDocument();
  });

  it('calls logout function when logout button is clicked', () => {
    render(<Header />);
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});