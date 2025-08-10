import React from 'react';

// Escape special regex chars
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * highlightMatch
 * Highlights ALL case-insensitive occurrences of term within text.
 * Returns original string when no term or no matches. Mark elements get aria-label for tests/a11y.
 */
export function highlightMatch(text: string, term: string) {
  if (!term) return text;
  const escaped = escapeRegExp(term);
  if (!escaped) return text;
  const regex = new RegExp(escaped, 'ig');
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <mark
        key={`h-${key++}`}
        className="bg-yellow-200 rounded px-0.5"
        aria-label="highlighted search term"
        data-testid="highlight-fragment"
      >
        {text.slice(start, end)}
      </mark>
    );
    lastIndex = end;
  }
  if (lastIndex === 0) return text; // no matches
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <span data-testid="highlighted-text">{parts}</span>;
}

