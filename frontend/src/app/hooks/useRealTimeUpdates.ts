import { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery, useQueryClient, UseQueryResult } from 'react-query';
import { apiService } from '../../lib/api';
import { CACHE_CONFIG, CACHE_KEYS, createCacheKey } from '../../lib/cacheUtils';

// Types for our real-time data
interface RealTimeData<T> {
  data: T;
  timestamp: number;
}

// Generic hook for real-time updates
export const useRealTimeUpdates = <T,>(
  key: string | unknown[],
  endpoint: string,
  interval: number = 5000 // 5 seconds default
): UseQueryResult<RealTimeData<T>, Error> & { 
  lastUpdated: number | null;
  isPolling: boolean;
} => {
  const queryClient = useQueryClient();
  const lastUpdatedRef = useRef<number | null>(null);
  
  // Fetch data function
  const fetchData = async (): Promise<RealTimeData<T>> => {
    try {
      const response = await apiService.get<T>(endpoint);
      const timestamp = Date.now();
      lastUpdatedRef.current = timestamp;
      
      return {
        data: response.data as T,
        timestamp
      };
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  };
  
  // Create a memoized cache key to prevent unnecessary re-renders
  const cacheKey = useMemo(() => {
    if (Array.isArray(key)) {
      return [...key, endpoint];
    }
    return createCacheKey(key, endpoint);
  }, [key, endpoint]);
  
  // Use react-query for data fetching and caching with improved configuration
  const queryResult = useQuery<RealTimeData<T>, Error>(
    cacheKey,
    fetchData,
    {
      refetchInterval: interval,
      // Use shorter stale time for real-time data
      staleTime: Math.min(interval, CACHE_CONFIG.SHORT_CACHE_TIME),
      // Cache for longer than the polling interval to prevent unnecessary refetches
      cacheTime: interval * 3,
      // Enable background refetching
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // Retry failed requests
      retry: 2,
      // Keep previous data while fetching new data
      keepPreviousData: true,
      // Error handling
      onError: (error) => {
        console.error(`Error in real-time updates for ${key}:`, error);
      }
    }
  );
  
  // Return enhanced result with additional properties
  return {
    ...queryResult,
    lastUpdated: lastUpdatedRef.current,
    isPolling: queryResult.isFetching && !queryResult.isLoading
  } as UseQueryResult<RealTimeData<T>, Error> & { 
    lastUpdated: number | null;
    isPolling: boolean;
  };
};

// Specific hooks for our application data

// Hook for real-time queue updates with pagination support
export const useQueueUpdates = (page: number = 1, pageSize: number = 10) => {
  const endpoint = useMemo(() => `/queue?page=${page}&limit=${pageSize}`, [page, pageSize]);
  
  return useRealTimeUpdates<{
    success: boolean;
    data: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>(
    [CACHE_KEYS.QUEUE, page, pageSize],
    endpoint,
    3000 // Update every 3 seconds for queue
  );
};

// Hook for real-time appointment updates with pagination support
export const useAppointmentUpdates = (page: number = 1, pageSize: number = 10, date?: string) => {
  const endpoint = useMemo(() => {
    let url = `/appointments?page=${page}&limit=${pageSize}`;
    if (date) url += `&date=${date}`;
    return url;
  }, [page, pageSize, date]);
  
  return useRealTimeUpdates<{
    success: boolean;
    data: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>(
    [CACHE_KEYS.APPOINTMENTS, page, pageSize, date],
    endpoint,
    5000 // Update every 5 seconds for appointments
  );
};

// Hook for real-time doctor status updates with pagination support
export const useDoctorStatusUpdates = (page: number = 1, pageSize: number = 10, status?: string) => {
  const endpoint = useMemo(() => {
    let url = `/doctors?page=${page}&limit=${pageSize}`;
    if (status) url += `&status=${status}`;
    return url;
  }, [page, pageSize, status]);
  
  return useRealTimeUpdates<{
    success: boolean;
    data: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>(
    [CACHE_KEYS.DOCTORS, page, pageSize, status],
    endpoint,
    10000 // Update every 10 seconds for doctor status
  );
};

// Hook for real-time dashboard stats
export const useDashboardStatsUpdates = () => {
  return useRealTimeUpdates<any>(
    CACHE_KEYS.DASHBOARD,
    '/dashboard/stats',
    10000 // Update every 10 seconds for stats
  );
};

// Utility hook for optimistic updates with improved caching
export const useOptimisticUpdate = <T,>(
  key: string | unknown[],
  updateFn: (oldData: T | undefined, newData: T) => T
) => {
  const queryClient = useQueryClient();
  
  return (newData: T) => {
    // Update the cache optimistically
    queryClient.setQueryData<T>(key, (oldData: T | undefined) => 
      updateFn(oldData, newData)
    );
    
    // Optionally, you can set this data as fresh for a short period
    // to prevent immediate refetching
    queryClient.invalidateQueries(key, {
      refetchActive: false,
      refetchInactive: false
    });
  };
};

// Utility hook for showing notifications
export const useNotifications = () => {
  // Lazy import inside hook to avoid circular dependencies if any
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const toastCtx = require('../components/ToastProvider');
  const useToast = toastCtx.useToast as () => { success: (m:string)=>void; error:(m:string)=>void; info:(m:string)=>void };
  const { success, error } = useToast();
  return {
    showSuccess: success,
    showError: error,
  };
};