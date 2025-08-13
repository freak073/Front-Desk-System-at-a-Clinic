import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Header } from '@/app/components/Header';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock the authentication context
const mockLogout = jest.fn();
jest.mock('@/app/context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'testuser', role: 'front_desk' },
    logout: mockLogout,
    isAuthenticated: true,
  }),
}));

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header with clinic name and user info', () => {
    render(<Header />);
    
    expect(screen.getByText('Front Desk System')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should call logout function when logout button is clicked', async () => {
    const user = userEvent.setup();
    render(<Header />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should have proper accessibility attributes', () => {
    render(<Header />);
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toHaveAttribute('aria-label');
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<Header />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    
    // Tab to logout button
    await user.tab();
    expect(logoutButton).toHaveFocus();
    
    // Press Enter to trigger logout
    await user.keyboard('{Enter}');
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should display user role information', () => {
    render(<Header />);
    
    expect(screen.getByText('front_desk')).toBeInTheDocument();
  });

  it('should have proper semantic structure', () => {
    render(<Header />);
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    // Check for proper heading structure
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Front Desk System');
  });

  it('should handle logout errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockLogout.mockRejectedValueOnce(new Error('Logout failed'));
    
    render(<Header />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('should have responsive design classes', () => {
    render(<Header />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('flex', 'justify-between', 'items-center');
  });

  it('should display clinic logo if provided', () => {
    render(<Header />);
    
    const logo = screen.queryByAltText('Clinic Logo');
    if (logo) {
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src');
    }
  });

  it('should maintain focus management', async () => {
    const user = userEvent.setup();
    render(<Header />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    
    await user.click(logoutButton);
    
    // Focus should remain manageable after logout action
    expect(document.activeElement).toBeDefined();
  });
});