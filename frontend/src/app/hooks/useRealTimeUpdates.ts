import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient, UseQueryResult, useMutation } from 'react-query';
import { apiService } from '../../lib/api';
import { CACHE_CONFIG, CACHE_KEYS, createCacheKey } from '../../lib/cacheUtils';
import { useGlobalState } from '../../context/GlobalStateContext';
import { useToast } from '../components/ToastProvider';

// Types for our real-time data
interface RealTimeData<T> {
  data: T;
  timestamp: number;
}

// Enhanced generic hook for real-time updates with global state integration
export const useRealTimeUpdates = <T,>(
  key: string | unknown[],
  endpoint: string,
  interval: number = 5000, // 5 seconds default
  options?: {
    enabled?: boolean;
    onSuccess?: (data: RealTimeData<T>) => void;
    onError?: (error: Error) => void;
    optimisticUpdates?: boolean;
  }
): UseQueryResult<RealTimeData<T>, Error> & { 
  lastUpdated: number | null;
  isPolling: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
} => {
  const queryClient = useQueryClient();
  const lastUpdatedRef = useRef<number | null>(null);
  const { state, setSyncStatus, setErrorState } = useGlobalState();
  const { success: showSuccess, error: showError } = useToast();
  
  // Determine the data type for sync status tracking
  const dataType = useMemo(() => {
    if (typeof key === 'string') {
      return key as keyof typeof state.syncStatus;
    }
    if (Array.isArray(key) && typeof key[0] === 'string') {
      return key[0] as keyof typeof state.syncStatus;
    }
    return 'queue' as keyof typeof state.syncStatus; // fallback
  }, [key]);
  
  // Fetch data function with enhanced error handling
  const fetchData = async (): Promise<RealTimeData<T>> => {
    try {
      setSyncStatus(dataType, 'syncing');
      const response = await apiService.get<T>(endpoint);
      const timestamp = Date.now();
      lastUpdatedRef.current = timestamp;
      
      setSyncStatus(dataType, 'idle');
      setErrorState(dataType, null);
      
      const result = {
        data: response.data as T,
        timestamp
      };
      
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      setSyncStatus(dataType, 'error');
      setErrorState(dataType, error instanceof Error ? error.message : 'Unknown error');
      options?.onError?.(error as Error);
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
      enabled: options?.enabled !== false && state.isOnline,
      refetchInterval: state.isOnline ? interval : false,
      // Use shorter stale time for real-time data
      staleTime: Math.min(interval, CACHE_CONFIG.SHORT_CACHE_TIME),
      // Cache for longer than the polling interval to prevent unnecessary refetches
      cacheTime: interval * 3,
      // Enable background refetching
      refetchOnWindowFocus: state.isOnline,
      refetchOnReconnect: true,
      // Retry failed requests with exponential backoff
      retry: (failureCount, error) => {
        if (!state.isOnline) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Keep previous data while fetching new data
      keepPreviousData: true,
      // Error handling
      onError: (error) => {
        console.error(`Error in real-time updates for ${key}:`, error);
        setSyncStatus(dataType, 'error');
      },
      onSuccess: () => {
        setSyncStatus(dataType, 'idle');
      }
    }
  );
  
  // Return enhanced result with additional properties
  return {
    ...queryResult,
    lastUpdated: lastUpdatedRef.current,
    isPolling: queryResult.isFetching && !queryResult.isLoading,
    syncStatus: state.syncStatus[dataType] || 'idle'
  } as UseQueryResult<RealTimeData<T>, Error> & { 
    lastUpdated: number | null;
    isPolling: boolean;
    syncStatus: 'idle' | 'syncing' | 'error';
  };
};

// Specific hooks for our application data

// Hook for real-time queue updates with pagination support
export const useQueueUpdates = (
  page: number = 1, 
  pageSize: number = 10,
  options?: {
    enabled?: boolean;
    onSuccess?: (data: RealTimeData<any>) => void;
    onError?: (error: Error) => void;
    optimisticUpdates?: boolean;
  }
) => {
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
    3000, // Update every 3 seconds for queue
    options
  );
};

// Hook for real-time appointment updates with pagination support
export const useAppointmentUpdates = (
  page: number = 1, 
  pageSize: number = 10, 
  date?: string,
  options?: {
    enabled?: boolean;
    onSuccess?: (data: RealTimeData<any>) => void;
    onError?: (error: Error) => void;
    optimisticUpdates?: boolean;
  }
) => {
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
    5000, // Update every 5 seconds for appointments
    options
  );
};

// Hook for real-time doctor status updates with pagination support
export const useDoctorStatusUpdates = (
  page: number = 1, 
  pageSize: number = 10, 
  status?: string,
  options?: {
    enabled?: boolean;
    onSuccess?: (data: RealTimeData<any>) => void;
    onError?: (error: Error) => void;
    optimisticUpdates?: boolean;
  }
) => {
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
    10000, // Update every 10 seconds for doctor status
    options
  );
};

// Hook for real-time dashboard stats
export const useDashboardStatsUpdates = (
  options?: {
    enabled?: boolean;
    onSuccess?: (data: RealTimeData<any>) => void;
    onError?: (error: Error) => void;
    optimisticUpdates?: boolean;
  }
) => {
  return useRealTimeUpdates<any>(
    CACHE_KEYS.DASHBOARD,
    '/dashboard/stats',
    10000, // Update every 10 seconds for stats
    options
  );
};

// Enhanced optimistic updates hook with global state integration
export const useOptimisticUpdate = <T,>(
  key: string | unknown[],
  updateFn: (oldData: T | undefined, newData: T) => T,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error, rollbackData: T | undefined) => void;
    showNotifications?: boolean;
  }
) => {
  const queryClient = useQueryClient();
  const { addOptimisticUpdate, removeOptimisticUpdate } = useGlobalState();
  const { success: showSuccess, error: showError } = useToast();
  
  return useCallback((
    newData: T, 
    mutationFn?: () => Promise<T>,
    updateType: 'create' | 'update' | 'delete' = 'update'
  ) => {
    const updateId = `${JSON.stringify(key)}-${Date.now()}`;
    const previousData = queryClient.getQueryData<T>(key);
    
    try {
      // Add to optimistic updates tracking
      addOptimisticUpdate(updateId, updateType, newData);
      
      // Update the cache optimistically
      queryClient.setQueryData<T>(key, (oldData: T | undefined) => 
        updateFn(oldData, newData)
      );
      
      // If mutation function is provided, execute it
      if (mutationFn) {
        mutationFn()
          .then((result) => {
            // Success - remove from optimistic updates and show notification
            removeOptimisticUpdate(updateId);
            options?.onSuccess?.(result);
            
            if (options?.showNotifications !== false) {
              const action = updateType === 'create' ? 'created' : 
                           updateType === 'delete' ? 'deleted' : 'updated';
              showSuccess(`Successfully ${action}`);
            }
            
            // Invalidate queries to ensure fresh data
            queryClient.invalidateQueries(key);
          })
          .catch((error) => {
            // Error - rollback optimistic update
            removeOptimisticUpdate(updateId);
            if (previousData !== undefined) {
              queryClient.setQueryData<T>(key, previousData);
            }
            
            options?.onError?.(error, previousData);
            
            if (options?.showNotifications !== false) {
              const action = updateType === 'create' ? 'create' : 
                           updateType === 'delete' ? 'delete' : 'update';
              showError(`Failed to ${action}: ${error.message}`);
            }
          });
      }
    } catch (error) {
      // Immediate error - rollback
      removeOptimisticUpdate(updateId);
      if (previousData !== undefined) {
        queryClient.setQueryData<T>(key, previousData);
      }
      
      if (options?.showNotifications !== false) {
        showError(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [queryClient, key, updateFn, addOptimisticUpdate, removeOptimisticUpdate, showSuccess, showError, options]);
};

// Enhanced notifications hook with global state integration
export const useNotifications = () => {
  const { success, error, info } = useToast();
  const { state } = useGlobalState();
  
  return {
    showSuccess: success,
    showError: error,
    showInfo: info,
    
    // Enhanced notification methods with context
    notifyDataUpdate: useCallback((dataType: string, action: 'created' | 'updated' | 'deleted') => {
      success(`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} ${action} successfully`);
    }, [success]),
    
    notifyDataError: useCallback((dataType: string, action: string, errorMessage?: string) => {
      error(`Failed to ${action} ${dataType}${errorMessage ? `: ${errorMessage}` : ''}`);
    }, [error]),
    
    notifyConnectionStatus: useCallback((isOnline: boolean) => {
      if (isOnline) {
        success('Connection restored');
      } else {
        error('Connection lost. Some features may not work properly.');
      }
    }, [success, error]),
    
    notifySyncStatus: useCallback((dataType: string, status: 'syncing' | 'completed' | 'failed') => {
      switch (status) {
        case 'syncing':
          info(`Syncing ${dataType}...`);
          break;
        case 'completed':
          success(`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} synced`);
          break;
        case 'failed':
          error(`Failed to sync ${dataType}`);
          break;
      }
    }, [info, success, error]),
  };
};