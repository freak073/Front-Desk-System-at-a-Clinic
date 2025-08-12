'use client';

import React from 'react';
import { PaginationControls } from '../../lib/pagination';

export interface SearchablePaginationProps {
  pagination: PaginationControls;
  totalResults: number;
  filteredResults: number;
  isFiltered: boolean;
  searchTerm?: string;
  className?: string;
  showResultSummary?: boolean;
}

/**
 * Enhanced pagination component that shows search/filter context
 */
const SearchablePagination: React.FC<SearchablePaginationProps> = ({
  pagination,
  totalResults,
  filteredResults,
  isFiltered,
  searchTerm,
  className = '',
  showResultSummary = true
}) => {
  const {
    page,
    totalPages,
    pageNumbers,
    nextPage,
    prevPage,
    goToPage,
    canNextPage,
    canPrevPage,
    pageSize
  } = pagination;

  if (totalPages <= 1 && !showResultSummary) {
    return null;
  }

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, filteredResults);

  return (
    <div className={`border-t border-gray-700 px-4 py-3 text-gray-300 ${className}`}>
      {showResultSummary && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="text-sm text-gray-400">
            {isFiltered ? (
              <span>
                Showing {startItem}-{endItem} of {filteredResults} filtered results
                {searchTerm && (
                  <span> for "<span className="font-medium text-gray-300">{searchTerm}</span>"</span>
                )}
                <span className="text-gray-500"> (from {totalResults} total)</span>
              </span>
            ) : (
              <span>
                Showing {startItem}-{endItem} of {totalResults} results
              </span>
            )}
          </div>
          
          {isFiltered && (
            <div className="mt-2 sm:mt-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-600/20 text-accent-300">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filtered
              </span>
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between sm:justify-center">
          {/* Mobile pagination */}
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={prevPage}
              disabled={!canPrevPage}
              className={`relative inline-flex items-center rounded-md border border-gray-600 bg-surface-800 px-4 py-2 text-sm font-medium ${
                canPrevPage 
                  ? 'text-gray-300 hover:bg-surface-700' 
                  : 'text-gray-600 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={!canNextPage}
              className={`relative inline-flex items-center rounded-md border border-gray-600 bg-surface-800 px-4 py-2 text-sm font-medium ${
                canNextPage 
                  ? 'text-gray-300 hover:bg-surface-700' 
                  : 'text-gray-600 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
          
          {/* Desktop pagination */}
          <div className="hidden sm:flex sm:items-center sm:space-x-1">
            <button
              onClick={prevPage}
              disabled={!canPrevPage}
              className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                canPrevPage 
                  ? 'text-gray-400 hover:bg-surface-700' 
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              aria-label="Previous page"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Page numbers */}
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                aria-current={page === pageNum ? 'page' : undefined}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                  page === pageNum
                    ? 'z-10 bg-accent-600 border-accent-500 text-white'
                    : 'bg-surface-800 border-gray-600 text-gray-400 hover:bg-surface-700'
                }`}
              >
                {pageNum}
              </button>
            ))}
            
            <button
              onClick={nextPage}
              disabled={!canNextPage}
              className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                canNextPage 
                  ? 'text-gray-400 hover:bg-surface-700' 
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              aria-label="Next page"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default SearchablePagination;