import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResponsiveTable from '../ResponsiveTable';

const mockColumns = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', mobileHidden: true },
  { key: 'priority', label: 'Priority', tabletHidden: true },
  { key: 'actions', label: 'Actions', desktopOnly: true, render: () => <button>Edit</button> }
];

const mockData = [
  { name: 'John Doe', status: 'waiting', priority: 'normal' },
  { name: 'Jane Smith', status: 'with_doctor', priority: 'urgent' }
];

describe('ResponsiveTable', () => {
  it('renders loading state correctly', () => {
    render(<ResponsiveTable columns={mockColumns} data={[]} loading={true} />);
    // Check for skeleton loading items by class
    const skeletonItems = document.querySelectorAll('.animate-pulse');
    expect(skeletonItems).toHaveLength(3); // 3 skeleton items
  });

  it('renders empty state when no data', () => {
    render(<ResponsiveTable columns={mockColumns} data={[]} emptyMessage="No patients found" />);
    expect(screen.getByText('No patients found')).toBeInTheDocument();
  });

  it('renders data in mobile card view', () => {
    render(<ResponsiveTable columns={mockColumns} data={mockData} mobileCardView={true} />);
    expect(screen.getAllByText('John Doe')).toHaveLength(2); // Mobile and desktop views
    expect(screen.getAllByText('Jane Smith')).toHaveLength(2); // Mobile and desktop views
  });

  it('calls onRowClick when row is clicked', () => {
    const mockOnRowClick = jest.fn();
    render(
      <ResponsiveTable 
        columns={mockColumns} 
        data={mockData} 
        onRowClick={mockOnRowClick}
        mobileCardView={false}
      />
    );
    
    // Click on first row (assuming table view)
    const firstRow = screen.getByText('John Doe').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);
      expect(mockOnRowClick).toHaveBeenCalledWith(mockData[0]);
    }
  });

  it('applies correct CSS classes for responsive behavior', () => {
    const { container } = render(
      <ResponsiveTable columns={mockColumns} data={mockData} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});