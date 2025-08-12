import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterBar from '../FilterBar';

describe('FilterBar', () => {
  const mockOnChange = jest.fn();
  const mockOnClear = jest.fn();
  const mockOnClearAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    search: {
      value: '',
      onChange: mockOnChange,
      placeholder: 'Search...'
    },
    selects: [
      {
        id: 'status',
        label: 'Status',
        value: 'all',
        onChange: mockOnChange,
        options: [
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      }
    ],
    onClear: mockOnClear,
    onClearAll: mockOnClearAll
  };

  it('renders search input with placeholder', () => {
    render(<FilterBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders select filters', () => {
    render(<FilterBar {...defaultProps} />);
    
    const statusSelect = screen.getByLabelText('Status');
    expect(statusSelect).toBeInTheDocument();
    expect(statusSelect).toHaveValue('all');
  });

  it('calls onChange when search input changes', () => {
    render(<FilterBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('test search');
  });

  it('calls onChange when select value changes', () => {
    render(<FilterBar {...defaultProps} />);
    
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.change(statusSelect, { target: { value: 'active' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('active');
  });

  it('renders clear filters button and calls onClear', () => {
    render(<FilterBar {...defaultProps} />);
    
    const clearButton = screen.getByText('Clear Filters');
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('renders clear all button when isFiltered is true', () => {
    render(<FilterBar {...defaultProps} isFiltered={true} />);
    
    const clearAllButton = screen.getByText('Clear All');
    expect(clearAllButton).toBeInTheDocument();
    
    fireEvent.click(clearAllButton);
    expect(mockOnClearAll).toHaveBeenCalled();
  });

  it('shows result count when showResultCount is true', () => {
    render(
      <FilterBar 
        {...defaultProps} 
        showResultCount={true} 
        resultCount={5} 
        isFiltered={false}
      />
    );
    
    expect(screen.getByText('5 results found')).toBeInTheDocument();
  });

  it('shows filtered indicator when isFiltered is true', () => {
    render(
      <FilterBar 
        {...defaultProps} 
        showResultCount={true} 
        resultCount={3} 
        isFiltered={true}
      />
    );
    
    expect(screen.getByText('3 results found (filtered)')).toBeInTheDocument();
    expect(screen.getByText('Filters active')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <FilterBar 
        {...defaultProps} 
        showResultCount={true} 
        loading={true}
      />
    );
    
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('shows no results message when resultCount is 0', () => {
    render(
      <FilterBar 
        {...defaultProps} 
        showResultCount={true} 
        resultCount={0}
      />
    );
    
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders search clear button when search has value', () => {
    const propsWithSearchValue = {
      ...defaultProps,
      search: {
        ...defaultProps.search,
        value: 'test search'
      }
    };
    
    render(<FilterBar {...propsWithSearchValue} />);
    
    const clearSearchButton = screen.getByLabelText('Clear search');
    expect(clearSearchButton).toBeInTheDocument();
    
    fireEvent.click(clearSearchButton);
    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('shows counts in select options when showCounts is true', () => {
    const propsWithCounts = {
      ...defaultProps,
      selects: [
        {
          id: 'status',
          label: 'Status',
          value: 'all',
          onChange: mockOnChange,
          showCounts: true,
          options: [
            { value: 'all', label: 'All', count: 10 },
            { value: 'active', label: 'Active', count: 7 },
            { value: 'inactive', label: 'Inactive', count: 3 }
          ]
        }
      ]
    };
    
    render(<FilterBar {...propsWithCounts} />);
    
    const statusSelect = screen.getByLabelText('Status');
    expect(statusSelect).toBeInTheDocument();
    
    // Check if options with counts are rendered (this is a bit tricky to test directly)
    // We can check the HTML content
    expect(statusSelect.innerHTML).toContain('All (10)');
    expect(statusSelect.innerHTML).toContain('Active (7)');
    expect(statusSelect.innerHTML).toContain('Inactive (3)');
  });

  it('disables buttons when loading', () => {
    render(
      <FilterBar 
        {...defaultProps} 
        loading={true}
      />
    );
    
    const clearButton = screen.getByText('Clear Filters');
    expect(clearButton).toBeDisabled();
  });

  it('renders custom children', () => {
    render(
      <FilterBar {...defaultProps}>
        <div data-testid="custom-child">Custom Filter</div>
      </FilterBar>
    );
    
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });
});