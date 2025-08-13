import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueueList } from '@/app/components/QueueList';

// Mock data
const mockQueueData = [
  {
    id: 1,
    queueNumber: 1,
    patient: { id: 1, name: 'John Doe', contactInfo: '123-456-7890' },
    status: 'waiting',
    priority: 'normal',
    arrivalTime: new Date('2024-01-01T10:00:00Z'),
    estimatedWaitTime: 15,
  },
  {
    id: 2,
    queueNumber: 2,
    patient: { id: 2, name: 'Jane Smith', contactInfo: '098-765-4321' },
    status: 'with_doctor',
    priority: 'urgent',
    arrivalTime: new Date('2024-01-01T10:15:00Z'),
    estimatedWaitTime: 5,
  },
];

const defaultProps = {
  queueData: mockQueueData,
  onStatusUpdate: jest.fn(),
  onRemoveFromQueue: jest.fn(),
  isLoading: false,
};

describe('QueueList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render queue list with patient data', () => {
    render(<QueueList {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Queue number
    expect(screen.getByText('2')).toBeInTheDocument(); // Queue number
  });

  it('should display patient status correctly', () => {
    render(<QueueList {...defaultProps} />);
    
    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.getByText('With Doctor')).toBeInTheDocument();
  });

  it('should display priority indicators', () => {
    render(<QueueList {...defaultProps} />);
    
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('should display estimated wait times', () => {
    render(<QueueList {...defaultProps} />);
    
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('5 min')).toBeInTheDocument();
  });

  it('should call onStatusUpdate when status is changed', async () => {
    const user = userEvent.setup();
    render(<QueueList {...defaultProps} />);
    
    const statusSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(statusSelect, 'with_doctor');
    
    expect(defaultProps.onStatusUpdate).toHaveBeenCalledWith(1, 'with_doctor');
  });

  it('should call onRemoveFromQueue when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<QueueList {...defaultProps} />);
    
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);
    
    expect(defaultProps.onRemoveFromQueue).toHaveBeenCalledWith(1);
  });

  it('should display loading state', () => {
    render(<QueueList {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display empty state when no queue data', () => {
    render(<QueueList {...defaultProps} queueData={[]} />);
    
    expect(screen.getByText('No patients in queue')).toBeInTheDocument();
  });

  it('should have proper table structure', () => {
    render(<QueueList {...defaultProps} />);
    
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    
    // Check headers
    expect(screen.getByText('Queue #')).toBeInTheDocument();
    expect(screen.getByText('Patient Name')).toBeInTheDocument();
    expect(screen.getByText('Arrival Time')).toBeInTheDocument();
    expect(screen.getByText('Est. Wait')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<QueueList {...defaultProps} />);
    
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'Patient Queue');
    
    const statusSelects = screen.getAllByRole('combobox');
    statusSelects.forEach(select => {
      expect(select).toHaveAttribute('aria-label');
    });
    
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    removeButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<QueueList {...defaultProps} />);
    
    const firstStatusSelect = screen.getAllByRole('combobox')[0];
    const firstRemoveButton = screen.getAllByRole('button', { name: /remove/i })[0];
    
    // Tab to first status select
    await user.tab();
    expect(firstStatusSelect).toHaveFocus();
    
    // Tab to first remove button
    await user.tab();
    expect(firstRemoveButton).toHaveFocus();
  });

  it('should display arrival time in readable format', () => {
    render(<QueueList {...defaultProps} />);
    
    // Should display time in HH:MM format
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('10:15')).toBeInTheDocument();
  });

  it('should highlight urgent priority patients', () => {
    render(<QueueList {...defaultProps} />);
    
    const urgentRow = screen.getByText('Jane Smith').closest('tr');
    expect(urgentRow).toHaveClass('priority-urgent');
  });

  it('should handle status update errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const onStatusUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));
    
    render(<QueueList {...defaultProps} onStatusUpdate={onStatusUpdate} />);
    
    const statusSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(statusSelect, 'with_doctor');
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });

  it('should sort queue by queue number', () => {
    const unsortedData = [
      { ...mockQueueData[1], queueNumber: 3 },
      { ...mockQueueData[0], queueNumber: 1 },
    ];
    
    render(<QueueList {...defaultProps} queueData={unsortedData} />);
    
    const rows = screen.getAllByRole('row');
    // First row is header, second should be queue #1
    expect(rows[1]).toHaveTextContent('1');
    expect(rows[2]).toHaveTextContent('3');
  });

  it('should display contact information when available', () => {
    render(<QueueList {...defaultProps} />);
    
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('098-765-4321')).toBeInTheDocument();
  });

  it('should handle missing contact information', () => {
    const dataWithoutContact = [
      {
        ...mockQueueData[0],
        patient: { ...mockQueueData[0].patient, contactInfo: null },
      },
    ];
    
    render(<QueueList {...defaultProps} queueData={dataWithoutContact} />);
    
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should update estimated wait time dynamically', () => {
    const { rerender } = render(<QueueList {...defaultProps} />);
    
    expect(screen.getByText('15 min')).toBeInTheDocument();
    
    const updatedData = [
      { ...mockQueueData[0], estimatedWaitTime: 10 },
      mockQueueData[1],
    ];
    
    rerender(<QueueList {...defaultProps} queueData={updatedData} />);
    
    expect(screen.getByText('10 min')).toBeInTheDocument();
  });

  it('should be responsive on mobile devices', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    render(<QueueList {...defaultProps} />);
    
    const table = screen.getByRole('table');
    expect(table).toHaveClass('responsive-table');
  });
});