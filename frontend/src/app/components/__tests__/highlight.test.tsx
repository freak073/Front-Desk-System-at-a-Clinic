import React from 'react';
import { render, screen } from '@testing-library/react';
import { highlightMatch } from '../highlight';

describe('highlightMatch utility', () => {
  it('returns plain string when term empty', () => {
    const result = highlightMatch('Hello World', '');
    expect(result).toBe('Hello World');
  });

  it('highlights single occurrence', () => {
    render(<div>{highlightMatch('Hello World', 'World')}</div>);
    const marks = screen.getAllByLabelText('highlighted search term');
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe('World');
  });

  it('highlights multiple occurrences case-insensitively', () => {
    render(<div>{highlightMatch('Test test TESTing', 'test')}</div>);
    const marks = screen.getAllByLabelText('highlighted search term');
    // Should highlight the three exact segments: Test, test, TEST
    expect(marks.length).toBe(3);
    expect(marks.map(m=>m.textContent)).toEqual(['Test','test','TEST']);
  });

  it('escapes regex special characters in term', () => {
    render(<div>{highlightMatch('a+b a+b a-b', 'a+b')}</div>);
    const marks = screen.getAllByLabelText('highlighted search term');
    expect(marks.length).toBe(2);
    expect(marks[0].textContent).toBe('a+b');
  });

  it('returns original string when no matches', () => {
    const result = highlightMatch('Alpha Beta', 'Gamma');
    expect(result).toBe('Alpha Beta');
  });
});
