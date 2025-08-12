import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SimpleModalExample from '../SimpleModalExample';

// Mock window.alert
const alertMock = jest.fn();
Object.defineProperty(window, 'alert', { value: alertMock });

describe('SimpleModalExample', () => {
  beforeEach(() => {
    alertMock.mockClear();
  });

  it('renders the example page with open button', () => {
    render(<SimpleModalExample />);
    
    expect(screen.getByText('Simple Modal Example')).toBeInTheDocument();
    expect(screen.getByText('Open Modal')).toBeInTheDocument();
  });

  it('opens modal when button is clicked', async () => {
    render(<SimpleModalExample />);
    
    const openButton = screen.getByText('Open Modal');
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByText('Simple Form')).toBeInTheDocument();
    });
  });

  it('displays validation errors for empty form', async () => {
    const user = userEvent.setup();
    render(<SimpleModalExample />);
    
    const openButton = screen.getByText('Open Modal');
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByText('Simple Form')).toBeInTheDocument();
    });
    
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<SimpleModalExample />);
    
    const openButton = screen.getByText('Open Modal');
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByText('Simple Form')).toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByText('Submit');
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid data', async () => {
    const user = userEvent.setup();
    render(<SimpleModalExample />);
    
    const openButton = screen.getByText('Open Modal');
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByText('Simple Form')).toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByText('Submit');
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Form submitted successfully!');
    });
  });

  it('closes modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<SimpleModalExample />);
    
    const openButton = screen.getByText('Open Modal');
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByText('Simple Form')).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Simple Form')).not.toBeInTheDocument();
    });
  });
});