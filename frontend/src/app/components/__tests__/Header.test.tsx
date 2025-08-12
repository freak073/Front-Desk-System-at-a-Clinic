import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAuth } from '../../../context/AuthContext';
import Header from '../Header';

// Mock the useAuth hook
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockLogout = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Header', () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it('renders clinic logo and name', () => {
    mockUseAuth.mockReturnValue({
      user: { username: 'testuser' },
      logout: mockLogout,
    } as any);

    render(<Header />);
    
    expect(screen.getByText('Clinic Front Desk')).toBeInTheDocument();
  });

  it('displays user information when user is logged in', () => {
    mockUseAuth.mockReturnValue({
      user: { username: 'testuser' },
      logout: mockLogout,
    } as any);

    render(<Header />);
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Front Desk Staff')).toBeInTheDocument();
  });

  it('shows user avatar with first letter of username', () => {
    mockUseAuth.mockReturnValue({
      user: { username: 'john' },
      logout: mockLogout,
    } as any);

    render(<Header />);
    
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('handles username with no characters gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: { username: '' },
      logout: mockLogout,
    } as any);

    render(<Header />);
    
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('calls logout function when logout button is clicked', () => {
    mockUseAuth.mockReturnValue({
      user: { username: 'testuser' },
      logout: mockLogout,
    } as any);

    render(<Header />);
    
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('does not display user info when user is not logged in', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
    } as any);

    render(<Header />);
    
    expect(screen.queryByText('Front Desk Staff')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    mockUseAuth.mockReturnValue({
      user: { username: 'testuser' },
      logout: mockLogout,
    } as any);

    render(<Header />);
    
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    expect(logoutButton).toHaveAttribute('aria-label', 'Log out');
  });

  it('renders as a header element', () => {
    mockUseAuth.mockReturnValue({
      user: { username: 'testuser' },
      logout: mockLogout,
    } as any);

    render(<Header />);
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('applies responsive classes correctly', () => {
    mockUseAuth.mockReturnValue({
      user: { username: 'testuser' },
      logout: mockLogout,
    } as any);

    render(<Header />);
    
    // Check that user info has responsive visibility classes
    const userInfo = screen.getByText('Front Desk Staff').closest('div');
    expect(userInfo).toHaveClass('hidden', 'sm:block');
  });
});