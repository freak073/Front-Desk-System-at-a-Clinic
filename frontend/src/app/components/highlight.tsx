import React from 'react';

// Escape special regex chars
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface HighlightOptions {
  className?: string;
  caseSensitive?: boolean;
  wholeWords?: boolean;
  maxHighlights?: number;
}

/**
 * highlightMatch
 * Highlights ALL case-insensitive occurrences of term within text.
 * Returns original string when no term or no matches. Mark elements get aria-label for tests/a11y.
 */
export function highlightMatch(
  text: string, 
  term: string, 
  options: HighlightOptions = {}
): React.ReactNode {
  if (!text || !term) return text;
  
  const {
    className = 'bg-yellow-200 text-yellow-900 rounded px-0.5',
    caseSensitive = false,
    wholeWords = false,
    maxHighlights
  } = options;
  
  const escaped = escapeRegExp(term);
  if (!escaped) return text;
  
  let regexPattern = escaped;
  if (wholeWords) {
    regexPattern = `\\b${regexPattern}\\b`;
  }
  
  const flags = caseSensitive ? 'g' : 'ig';
  const regex = new RegExp(regexPattern, flags);
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  let highlightCount = 0;
  
  while ((match = regex.exec(text)) !== null) {
    if (maxHighlights && highlightCount >= maxHighlights) break;
    
    const start = match.index;
    const end = start + match[0].length;
    
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    
    parts.push(
      <mark
        key={`h-${key++}`}
        className={className}
        aria-label="highlighted search term"
        data-testid="highlight-fragment"
      >
        {text.slice(start, end)}
      </mark>
    );
    
    lastIndex = end;
    highlightCount++;
  }
  
  if (lastIndex === 0) return text; // no matches
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  
  return <span data-testid="highlighted-text">{parts}</span>;
}

/**
 * highlightMultipleTerms
 * Highlights multiple search terms with different colors
 */
export function highlightMultipleTerms(
  text: string,
  terms: string[],
  colors: string[] = [
    'bg-yellow-200 text-yellow-900',
    'bg-blue-200 text-blue-900',
    'bg-green-200 text-green-900',
    'bg-purple-200 text-purple-900',
    'bg-pink-200 text-pink-900'
  ]
): React.ReactNode {
  if (!text || !terms.length) return text;
  
  let result: React.ReactNode = text;
  
  terms.forEach((term, index) => {
    if (term && typeof result === 'string') {
      const colorClass = colors[index % colors.length];
      result = highlightMatch(result, term, { 
        className: `${colorClass} rounded px-0.5` 
      });
    }
  });
  
  return result;
}

/**
 * getHighlightedSearchPreview
 * Returns a preview of text with highlighted search terms, truncated around matches
 */
export function getHighlightedSearchPreview(
  text: string,
  searchTerm: string,
  maxLength: number = 150,
  contextLength: number = 50
): React.ReactNode {
  if (!text || !searchTerm) {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }
  
  const lowerText = text.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerTerm);
  
  if (matchIndex === -1) {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }
  
  // Calculate preview bounds
  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(text.length, matchIndex + searchTerm.length + contextLength);
  
  let preview = text.slice(start, end);
  
  // Add ellipsis if truncated
  if (start > 0) preview = '...' + preview;
  if (end < text.length) preview = preview + '...';
  
  return highlightMatch(preview, searchTerm);
}