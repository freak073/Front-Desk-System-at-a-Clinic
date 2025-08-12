import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalFormExample from '../ModalFormExample';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.confirm and alert
const confirmMock = jest.fn();
const alertMock = jest.fn();
Object.defineProperty(window, 'confirm', { value: confirmMock });
Object.defineProperty(window, 'alert', { value: alertMock });

describe('ModalFormExample', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    confirmMock.mockClear();
    alertMock.mockClear();
  });

  it('renders the example page with open button', () => {
    render(<ModalFormExample />);
    
    expect(screen.getByText('Modal Form Example')).toBeInTheDocument();
    expect(screen.getByText('Open Modal Form')).toBeInTheDocument();
  });

  it('opens modal when button is clicked', async () => {
    render(<ModalFormExample />);
    
    const openButton = screen.getByText('Open Modal Form');
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByText('Contact Form')).toBeInTheDocument();
    });
  });

  it('displays form fields in modal', async () => {
    render(<ModalFormExample />);
    
    const openButton = screen.getByText('Open Modal Form');
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Message')).toBeInTheDocument();
    });
  });

  it('validates form and shows errors', async () => {
    const user = userEvent.setup();
    render(<ModalFormExample />);
    
    const openButton = screen.getByText('Open Modal Form');
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByText('Contact Form')).toBeInTheDocument();
    });
    
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Message is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<ModalFormExample />);
    
    const openButton = screen.getByText('Open Modal Form');
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByText('Contact Form')).toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Message');
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'invalid-email');
    await user.type(messageInput, 'Test message');
    
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid data', async () => {
    const user = userEvent.setup();
    render(<ModalFormExample />);
    
    const openButton = screen.getByText('Open Modal Form');
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByText('Contact Form')).toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Message');
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(messageInput, 'Test message');
    
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Form submitted successfully!');
    });
  });

  it('clears form when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<ModalFormExample />);
    
    const openButton = screen.getByText('Open Modal Form');
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByText('Contact Form')).toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const messageInput = screen.getByLabelText('Message') as HTMLTextAreaElement;
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(messageInput, 'Test message');
    
    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
    expect(messageInput.value).toBe('Test message');
    
    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);
    
    expect(nameInput.value).toBe('');
    expect(emailInput.value).toBe('');
    expect(messageInput.value).toBe('');
  });

  it('persists form data to localStorage', async () => {
    const user = userEvent.setup();
    render(<ModalFormExample />);
    
    const openButton = screen.getByText('Open Modal Form');
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByText('Contact Form')).toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText('Name');
    await user.type(nameInput, 'John');
    
    // Should save to localStorage as user types
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'modal-form-contact-form',
        expect.stringContaining('John')
      );
    });
  });

  it('shows unsaved changes indicator', async () => {
    const user = userEvent.setup();
    render(<ModalFormExample />);
    
    const openButton = screen.getByText('Open Modal Form');
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByText('Contact Form')).toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText('Name');
    await user.type(nameInput, 'John');
    
    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
  });
});