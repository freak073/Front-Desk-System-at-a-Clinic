'use client';

import React from 'react';
import { highlightMatch } from './highlight';

export interface SearchResultsProps<T> {
  data: T[];
  searchTerm: string;
  isFiltered: boolean;
  loading?: boolean;
  error?: string | null;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  noResultsTitle?: string;
  noResultsMessage?: string;
  renderItem: (item: T, index: number, searchTerm: string) => React.ReactNode;
  className?: string;
  showResultCount?: boolean;
  onRetry?: () => void;
}

/**
 * Enhanced search results component with loading states, error handling, and empty states
 */
function SearchResults<T>({
  data,
  searchTerm,
  isFiltered,
  loading = false,
  error = null,
  emptyStateTitle = 'No data available',
  emptyStateMessage = 'There are no items to display.',
  noResultsTitle = 'No results found',
  noResultsMessage = 'No items match your search criteria. Try adjusting your filters.',
  renderItem,
  className = '',
  showResultCount = false,
  onRetry
}: SearchResultsProps<T>) {
  // Loading state
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <div key={`skeleton-${i}`} className="bg-surface-800 border border-gray-700 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-4 bg-gray-600 rounded w-1/4"></div>
                <div className="h-4 bg-gray-600 rounded w-1/3"></div>
                <div className="h-4 bg-gray-600 rounded w-1/6"></div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                <div className="h-3 bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-6">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-red-300 mb-2">Error Loading Data</h3>
          <p className="text-red-200 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state (no data at all)
  if (!isFiltered && data.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-surface-800 border border-gray-700 rounded-lg p-8">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4a1 1 0 00-1-1H9a1 1 0 00-1 1v1m4 0h1m-6 0h1m5 8a1 1 0 100-2 1 1 0 000 2zm-8 0a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-300 mb-2">{emptyStateTitle}</h3>
          <p className="text-gray-400">{emptyStateMessage}</p>
        </div>
      </div>
    );
  }

  // No results state (filtered but no matches)
  if (isFiltered && data.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-surface-800 border border-gray-700 rounded-lg p-8">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-300 mb-2">{noResultsTitle}</h3>
          <p className="text-gray-400 mb-4">{noResultsMessage}</p>
          {searchTerm && (
            <div className="text-sm text-gray-500">
              Searched for: <span className="font-medium text-gray-400">"{searchTerm}"</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Results
  return (
    <div className={className}>
      {showResultCount && (
        <div className="mb-4 text-sm text-gray-400">
          {data.length} result{data.length === 1 ? '' : 's'}
          {searchTerm && (
            <span> for "<span className="font-medium text-gray-300">{searchTerm}</span>"</span>
          )}
        </div>
      )}
      <div className="space-y-4">
        {data.map((item, index) => renderItem(item, index, searchTerm))}
      </div>
    </div>
  );
}

export default SearchResults;