/**
 * Utility functions for pagination in the frontend
 */

import { useMemo } from 'react';

/**
 * Interface for pagination state
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/**
 * Interface for pagination controls
 */
export interface PaginationControls extends PaginationState {
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  canNextPage: boolean;
  canPrevPage: boolean;
  pageNumbers: number[];
}

/**
 * Hook to manage pagination state and controls
 * @param initialPage - Initial page number (default: 1)
 * @param initialPageSize - Initial page size (default: 10)
 * @param total - Total number of items
 * @param onPageChange - Optional callback when page changes
 * @returns Pagination controls
 */
export function usePagination(
  initialPage: number = 1,
  initialPageSize: number = 10,
  total: number = 0,
  onPageChange?: (page: number, pageSize: number) => void
): PaginationControls {
  const [page, setPage] = React.useState(initialPage);
  const [pageSize, setPageSizeState] = React.useState(initialPageSize);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  // Reset to page 1 if current page is out of bounds
  React.useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [totalPages, page]);

  // Generate array of page numbers for pagination controls
  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if end page is at maximum
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }, [page, totalPages]);

  // Navigation functions
  const nextPage = React.useCallback(() => {
    if (page < totalPages) {
      const newPage = page + 1;
      setPage(newPage);
      onPageChange?.(newPage, pageSize);
    }
  }, [page, totalPages, pageSize, onPageChange]);

  const prevPage = React.useCallback(() => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      onPageChange?.(newPage, pageSize);
    }
  }, [page, pageSize, onPageChange]);

  const goToPage = React.useCallback((newPage: number) => {
    const validPage = Math.min(Math.max(1, newPage), totalPages);
    setPage(validPage);
    onPageChange?.(validPage, pageSize);
  }, [totalPages, pageSize, onPageChange]);

  const setPageSize = React.useCallback((newSize: number) => {
    setPageSizeState(newSize);
    // Reset to page 1 when changing page size
    setPage(1);
    onPageChange?.(1, newSize);
  }, [onPageChange]);

  return {
    page,
    pageSize,
    total,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    canNextPage: page < totalPages,
    canPrevPage: page > 1,
    pageNumbers,
  };
}

/**
 * Calculate pagination metadata for API responses
 * @param total - Total number of items
 * @param page - Current page number
 * @param pageSize - Number of items per page
 * @returns Pagination metadata
 */
export function calculatePaginationMetadata(total: number, page: number, pageSize: number) {
  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  
  return {
    total,
    page,
    pageSize,
    totalPages,
    from,
    to,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

/**
 * Apply pagination to an array of items
 * @param items - Array of items to paginate
 * @param page - Current page number
 * @param pageSize - Number of items per page
 * @returns Paginated array and metadata
 */
export function paginateArray<T>(items: T[], page: number, pageSize: number) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return {
    data: paginatedItems,
    meta: calculatePaginationMetadata(items.length, page, pageSize),
  };
}

/**
 * React import
 */
import * as React from 'react';