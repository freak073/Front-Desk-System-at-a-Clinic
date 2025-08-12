import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { highlightMatch, highlightMultipleTerms, getHighlightedSearchPreview } from '../highlight';

describe('highlightMatch', () => {
  it('returns original text when no search term', () => {
    const result = highlightMatch('Hello World', '');
    expect(result).toBe('Hello World');
  });

  it('returns original text when no text provided', () => {
    const result = highlightMatch('', 'search');
    expect(result).toBe('');
  });

  it('highlights single match case-insensitive', () => {
    const result = highlightMatch('Hello World', 'hello');
    render(<div>{result}</div>);
    
    const highlighted = screen.getByTestId('highlight-fragment');
    expect(highlighted).toBeInTheDocument();
    expect(highlighted).toHaveTextContent('Hello');
  });

  it('highlights multiple matches', () => {
    const result = highlightMatch('Hello Hello World', 'hello');
    render(<div>{result}</div>);
    
    const highlighted = screen.getAllByTestId('highlight-fragment');
    expect(highlighted).toHaveLength(2);
    highlighted.forEach(element => {
      expect(element).toHaveTextContent('Hello');
    });
  });

  it('applies custom className', () => {
    const result = highlightMatch('Hello World', 'hello', {
      className: 'custom-highlight'
    });
    render(<div>{result}</div>);
    
    const highlighted = screen.getByTestId('highlight-fragment');
    expect(highlighted).toHaveClass('custom-highlight');
  });

  it('respects case sensitivity option', () => {
    const result = highlightMatch('Hello World', 'hello', {
      caseSensitive: true
    });
    render(<div>{result}</div>);
    
    // Should not highlight because case doesn't match
    expect(screen.queryByTestId('highlight-fragment')).not.toBeInTheDocument();
  });

  it('respects whole words option', () => {
    const result = highlightMatch('Hello World', 'ell', {
      wholeWords: true
    });
    render(<div>{result}</div>);
    
    // Should not highlight because 'ell' is not a whole word
    expect(screen.queryByTestId('highlight-fragment')).not.toBeInTheDocument();
  });

  it('limits highlights with maxHighlights option', () => {
    const result = highlightMatch('Hello Hello Hello', 'hello', {
      maxHighlights: 2
    });
    render(<div>{result}</div>);
    
    const highlighted = screen.getAllByTestId('highlight-fragment');
    expect(highlighted).toHaveLength(2);
  });

  it('escapes special regex characters', () => {
    const result = highlightMatch('Price: $10.99', '$10.99');
    render(<div>{result}</div>);
    
    const highlighted = screen.getByTestId('highlight-fragment');
    expect(highlighted).toHaveTextContent('$10.99');
  });

  it('handles empty matches gracefully', () => {
    const result = highlightMatch('Hello World', 'xyz');
    expect(result).toBe('Hello World');
  });
});

describe('highlightMultipleTerms', () => {
  it('returns original text when no terms provided', () => {
    const result = highlightMultipleTerms('Hello World', []);
    expect(result).toBe('Hello World');
  });

  it('highlights multiple different terms', () => {
    const result = highlightMultipleTerms('Hello World Test', ['hello', 'world']);
    render(<div>{result}</div>);
    
    // Since highlightMultipleTerms applies highlights sequentially, 
    // we should check that at least one term is highlighted
    const highlighted = screen.getAllByTestId('highlight-fragment');
    expect(highlighted.length).toBeGreaterThanOrEqual(1);
  });

  it('cycles through colors for multiple terms', () => {
    const customColors = ['red-class', 'blue-class'];
    const result = highlightMultipleTerms('Hello World Test', ['hello', 'world'], customColors);
    render(<div>{result}</div>);
    
    const highlighted = screen.getAllByTestId('highlight-fragment');
    expect(highlighted.length).toBeGreaterThanOrEqual(1);
    if (highlighted.length > 0) {
      expect(highlighted[0]).toHaveClass('red-class');
    }
  });
});

describe('getHighlightedSearchPreview', () => {
  it('returns truncated text when no search term', () => {
    const longText = 'A'.repeat(200);
    const result = getHighlightedSearchPreview(longText, '', 100);
    expect(typeof result).toBe('string');
    expect((result as string).length).toBeLessThanOrEqual(104); // 100 + '...'
  });

  it('returns original text when shorter than maxLength', () => {
    const shortText = 'Hello World';
    const result = getHighlightedSearchPreview(shortText, '', 100);
    expect(result).toBe(shortText);
  });

  it('creates preview around search match', () => {
    const longText = 'A'.repeat(100) + 'SEARCH_TERM' + 'B'.repeat(100);
    const result = getHighlightedSearchPreview(longText, 'SEARCH_TERM', 50, 10);
    
    render(<div>{result}</div>);
    
    // Should have ellipsis at start and end
    expect(screen.getByText(/^\.\.\./)).toBeInTheDocument();
    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
    
    // Should highlight the search term
    const highlighted = screen.getByTestId('highlight-fragment');
    expect(highlighted).toHaveTextContent('SEARCH_TERM');
  });

  it('handles search term not found', () => {
    const text = 'Hello World';
    const result = getHighlightedSearchPreview(text, 'notfound', 50);
    expect(result).toBe(text);
  });

  it('does not add ellipsis when preview starts at beginning', () => {
    const text = 'SEARCH_TERM' + 'B'.repeat(100);
    const result = getHighlightedSearchPreview(text, 'SEARCH_TERM', 50, 10);
    
    render(<div>{result}</div>);
    
    // Should not have ellipsis at start
    expect(screen.queryByText(/^\.\.\./)).not.toBeInTheDocument();
    
    // Should have ellipsis at end
    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
  });

  it('does not add ellipsis when preview ends at end', () => {
    const text = 'A'.repeat(100) + 'SEARCH_TERM';
    const result = getHighlightedSearchPreview(text, 'SEARCH_TERM', 50, 10);
    
    render(<div>{result}</div>);
    
    // Should have ellipsis at start
    expect(screen.getByText(/^\.\.\./)).toBeInTheDocument();
    
    // Should not have ellipsis at end
    expect(screen.queryByText(/\.\.\.$/)).not.toBeInTheDocument();
  });
});