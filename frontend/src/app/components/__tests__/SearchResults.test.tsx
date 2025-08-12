import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchResults from '../SearchResults';

describe('SearchResults', () => {
  const mockData = [
    { id: 1, name: 'John Doe', status: 'active' },
    { id: 2, name: 'Jane Smith', status: 'inactive' },
  ];

  const mockRenderItem = jest.fn((item, index, searchTerm) => (
    <div key={item.id} data-testid={`item-${item.id}`}>
      {item.name} - {searchTerm}
    </div>
  ));

  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    data: mockData,
    searchTerm: '',
    isFiltered: false,
    renderItem: mockRenderItem
  };

  it('renders data items using renderItem function', () => {
    render(<SearchResults {...defaultProps} />);
    
    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
    expect(mockRenderItem).toHaveBeenCalledTimes(2);
  });

  it('passes searchTerm to renderItem function', () => {
    render(<SearchResults {...defaultProps} searchTerm="john" />);
    
    expect(mockRenderItem).toHaveBeenCalledWith(mockData[0], 0, 'john');
    expect(mockRenderItem).toHaveBeenCalledWith(mockData[1], 1, 'john');
  });

  it('shows loading skeleton when loading is true', () => {
    render(<SearchResults {...defaultProps} loading={true} />);
    
    // Should show skeleton loaders
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThan(0);
    
    // Should not render actual data
    expect(screen.queryByTestId('item-1')).not.toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    render(
      <SearchResults 
        {...defaultProps} 
        error="Failed to load data" 
        onRetry={mockOnRetry}
      />
    );
    
    expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalled();
  });

  it('shows empty state when no data and not filtered', () => {
    render(
      <SearchResults 
        {...defaultProps} 
        data={[]}
        emptyStateTitle="No items"
        emptyStateMessage="Add some items to get started"
      />
    );
    
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Add some items to get started')).toBeInTheDocument();
  });

  it('shows no results state when filtered but no matches', () => {
    render(
      <SearchResults 
        {...defaultProps} 
        data={[]}
        isFiltered={true}
        searchTerm="nonexistent"
        noResultsTitle="No matches"
        noResultsMessage="Try different search terms"
      />
    );
    
    expect(screen.getByText('No matches')).toBeInTheDocument();
    expect(screen.getByText('Try different search terms')).toBeInTheDocument();
    expect(screen.getByText('Searched for:')).toBeInTheDocument();
    expect(screen.getByText('"nonexistent"')).toBeInTheDocument();
  });

  it('shows result count when showResultCount is true', () => {
    render(
      <SearchResults 
        {...defaultProps} 
        showResultCount={true}
        searchTerm="test"
      />
    );
    
    expect(screen.getByText('2 results')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('shows singular result text for single result', () => {
    render(
      <SearchResults 
        {...defaultProps} 
        data={[mockData[0]]}
        showResultCount={true}
        searchTerm="john"
      />
    );
    
    expect(screen.getByText('1 result')).toBeInTheDocument();
    expect(screen.getByText('john')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SearchResults 
        {...defaultProps} 
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('does not show search term in no results when searchTerm is empty', () => {
    render(
      <SearchResults 
        {...defaultProps} 
        data={[]}
        isFiltered={true}
        searchTerm=""
      />
    );
    
    expect(screen.queryByText(/Searched for:/)).not.toBeInTheDocument();
  });

  it('shows error state without retry button when onRetry is not provided', () => {
    render(
      <SearchResults 
        {...defaultProps} 
        error="Failed to load data"
      />
    );
    
    expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });
});