'use client';

import React from 'react';
import { PaginationControls } from '../../lib/pagination';

interface PaginationProps {
  pagination: PaginationControls;
  className?: string;
}

/**
 * Reusable pagination component that displays navigation controls
 * for moving between pages of data
 */
const Pagination: React.FC<PaginationProps> = ({ pagination, className = '' }) => {
  const {
    page,
    totalPages,
    pageNumbers,
    nextPage,
    prevPage,
    goToPage,
    canNextPage,
    canPrevPage,
  } = pagination;

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page
  }

  return (
    <nav className={`flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 py-3 ${className}`}>
      <div className="flex flex-1 w-0 sm:hidden">
        <button
          onClick={prevPage}
          disabled={!canPrevPage}
          className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${canPrevPage ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'}`}
        >
          Previous
        </button>
        <button
          onClick={nextPage}
          disabled={!canNextPage}
          className={`ml-3 relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${canNextPage ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'}`}
        >
          Next
        </button>
      </div>
      
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing page <span className="font-medium">{page}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={prevPage}
              disabled={!canPrevPage}
              className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${canPrevPage ? 'text-gray-400 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'}`}
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Page numbers */}
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                aria-current={page === pageNum ? 'page' : undefined}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${page === pageNum
                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                } border`}
              >
                {pageNum}
              </button>
            ))}
            
            <button
              onClick={nextPage}
              disabled={!canNextPage}
              className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${canNextPage ? 'text-gray-400 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'}`}
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </nav>
  );
};

export default Pagination;