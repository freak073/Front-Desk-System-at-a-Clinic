import React, { act } from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../page';

describe('HomePage', () => {
  it('renders the welcome message', () => {
    act(() => {
      render(<HomePage />);
    });

    expect(screen.getByText('Front Desk System')).toBeInTheDocument();
    expect(screen.getByText('Welcome to the Clinic Front Desk Management System')).toBeInTheDocument();
    expect(screen.getByText('Login to Dashboard')).toBeInTheDocument();
  });

  it('has a link to the login page', () => {
    act(() => {
      render(<HomePage />);
    });

    const loginLink = screen.getByRole('link', { name: 'Login to Dashboard' });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});