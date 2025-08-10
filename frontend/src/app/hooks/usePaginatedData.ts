'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQueueUpdates, useAppointmentUpdates, useDoctorStatusUpdates } from './useRealTimeUpdates';
import { usePagination, PaginationControls } from '../../lib/pagination';
import { debounce } from '../../lib/memoization';

/**
 * Interface for paginated data with controls
 */
export interface PaginatedDataResult<T> {
  data: T[];
  isLoading: boolean;
  isError: boolean;
  pagination: PaginationControls;
  lastUpdated: number | null;
  isPolling: boolean;
}

/**
 * Hook for paginated queue data with real-time updates
 * @param initialPage - Initial page number
 * @param initialPageSize - Initial page size
 * @returns Paginated queue data with controls
 */
export function usePaginatedQueue(
  initialPage: number = 1,
  initialPageSize: number = 10
): PaginatedDataResult<any> {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  // Fetch queue data with pagination
  const { 
    data: queueData, 
    isLoading, 
    isError,
    lastUpdated,
    isPolling
  } = useQueueUpdates(page, pageSize);
  
  // Get total count from the API response
  const total = queueData?.data?.meta?.total || 0;
  
  // Create debounced page change handler to prevent excessive API calls
  const handlePageChange = useCallback(
    debounce((newPage: number, newPageSize: number) => {
      setPage(newPage);
      setPageSize(newPageSize);
    }, 300),
    []
  );
  
  // Use the pagination utility
  const pagination = usePagination(page, pageSize, total, handlePageChange);
  
  // Extract the actual data items
  const items = useMemo(() => queueData?.data?.data || [], [queueData]);
  
  return {
    data: items,
    isLoading,
    isError,
    pagination,
    lastUpdated,
    isPolling
  };
}

/**
 * Hook for paginated appointment data with real-time updates
 * @param initialPage - Initial page number
 * @param initialPageSize - Initial page size
 * @param date - Optional date filter
 * @returns Paginated appointment data with controls
 */
export function usePaginatedAppointments(
  initialPage: number = 1,
  initialPageSize: number = 10,
  date?: string
): PaginatedDataResult<any> {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  // Fetch appointment data with pagination
  const { 
    data: appointmentData, 
    isLoading, 
    isError,
    lastUpdated,
    isPolling
  } = useAppointmentUpdates(page, pageSize, date);
  
  // Get total count from the API response
  const total = appointmentData?.data?.meta?.total || 0;
  
  // Create debounced page change handler
  const handlePageChange = useCallback(
    debounce((newPage: number, newPageSize: number) => {
      setPage(newPage);
      setPageSize(newPageSize);
    }, 300),
    []
  );
  
  // Use the pagination utility
  const pagination = usePagination(page, pageSize, total, handlePageChange);
  
  // Extract the actual data items
  const items = useMemo(() => appointmentData?.data?.data || [], [appointmentData]);
  
  return {
    data: items,
    isLoading,
    isError,
    pagination,
    lastUpdated,
    isPolling
  };
}

/**
 * Hook for paginated doctor data with real-time updates
 * @param initialPage - Initial page number
 * @param initialPageSize - Initial page size
 * @param status - Optional status filter
 * @returns Paginated doctor data with controls
 */
export function usePaginatedDoctors(
  initialPage: number = 1,
  initialPageSize: number = 10,
  status?: string
): PaginatedDataResult<any> {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  // Fetch doctor data with pagination
  const { 
    data: doctorData, 
    isLoading, 
    isError,
    lastUpdated,
    isPolling
  } = useDoctorStatusUpdates(page, pageSize, status);
  
  // Get total count from the API response
  const total = doctorData?.data?.meta?.total || 0;
  
  // Create debounced page change handler
  const handlePageChange = useCallback(
    debounce((newPage: number, newPageSize: number) => {
      setPage(newPage);
      setPageSize(newPageSize);
    }, 300),
    []
  );
  
  // Use the pagination utility
  const pagination = usePagination(page, pageSize, total, handlePageChange);
  
  // Extract the actual data items
  const items = useMemo(() => doctorData?.data?.data || [], [doctorData]);
  
  return {
    data: items,
    isLoading,
    isError,
    pagination,
    lastUpdated,
    isPolling
  };
}