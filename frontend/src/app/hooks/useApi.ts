/**
 * React hooks for using the optimized API client
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiRequestOptions, ApiResponse } from '../../lib/apiOptimization';

/**
 * API request state
 */
export interface ApiRequestState<T> {
  /** Response data */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Request metadata */
  meta: {
    /** Request duration in milliseconds */
    duration: number;
    /** Whether the response was cached */
    fromCache: boolean;
    /** Number of retry attempts */
    retryCount: number;
    /** Response status code */
    status: number | null;
  };
}

/**
 * Hook for making API requests with state management
 * @param url - Request URL
 * @param method - Request method
 * @param options - Request options
 * @returns API request state and functions
 */
export const useApi = <T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  options: ApiRequestOptions = {}
) => {
  // Request state
  const [state, setState] = useState<ApiRequestState<T>>({
    data: null,
    loading: false,
    error: null,
    meta: {
      duration: 0,
      fromCache: false,
      retryCount: 0,
      status: null,
    },
  });

  // Request data ref (for POST, PUT, PATCH)
  const dataRef = useRef<any>(null);

  // Execute request function
  const execute = useCallback(
    async (data?: any) => {
      // Update data ref
      if (data !== undefined) {
        dataRef.current = data;
      }

      // Set loading state
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        let response: ApiResponse<T>;

        // Execute request based on method
        switch (method) {
          case 'GET':
            response = await api.get<T>(url, options);
            break;
          case 'POST':
            response = await api.post<T>(url, dataRef.current, options);
            break;
          case 'PUT':
            response = await api.put<T>(url, dataRef.current, options);
            break;
          case 'PATCH':
            response = await api.patch<T>(url, dataRef.current, options);
            break;
          case 'DELETE':
            response = await api.delete<T>(url, options);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        // Update state with response
        setState({
          data: response.data,
          loading: false,
          error: null,
          meta: {
            duration: response.meta.duration,
            fromCache: response.meta.fromCache,
            retryCount: response.meta.retryCount,
            status: response.status,
          },
        });

        return response.data;
      } catch (error) {
        // Update state with error
        setState(prev => ({
          ...prev,
          loading: false,
          error,
          meta: {
            ...prev.meta,
            status: error.status || null,
          },
        }));

        throw error;
      }
    },
    [url, method, options]
  );

  // Reset state function
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      meta: {
        duration: 0,
        fromCache: false,
        retryCount: 0,
        status: null,
      },
    });
    dataRef.current = null;
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

/**
 * Hook for making API requests with automatic execution
 * @param url - Request URL
 * @param method - Request method
 * @param options - Request options
 * @param initialData - Initial data for the request
 * @param executeOnMount - Whether to execute the request on mount
 * @returns API request state and functions
 */
export const useApiEffect = <T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  options: ApiRequestOptions = {},
  initialData?: any,
  executeOnMount = true
) => {
  const api = useApi<T>(url, method, options);

  // Execute request on mount if enabled
  useEffect(() => {
    if (executeOnMount) {
      api.execute(initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return api;
};

/**
 * Hook for making API requests with React Query
 * @param queryKey - Query key for caching
 * @param url - Request URL
 * @param options - Request options
 * @param queryOptions - React Query options
 * @returns React Query result
 */
export const useApiQuery = <T>(
  queryKey: unknown[],
  url: string,
  options: ApiRequestOptions = {},
  queryOptions: any = {}
) => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get<T>(url, options);
      return response.data;
    },
    ...queryOptions,
  });
};

/**
 * Hook for making API mutations with React Query
 * @param url - Request URL
 * @param method - Request method
 * @param options - Request options
 * @param mutationOptions - React Query mutation options
 * @returns React Query mutation result
 */
export const useApiMutation = <T, V>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options: ApiRequestOptions = {},
  mutationOptions: any = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: V) => {
      let response: ApiResponse<T>;

      // Execute request based on method
      switch (method) {
        case 'POST':
          response = await api.post<T>(url, data, options);
          break;
        case 'PUT':
          response = await api.put<T>(url, data, options);
          break;
        case 'PATCH':
          response = await api.patch<T>(url, data, options);
          break;
        case 'DELETE':
          response = await api.delete<T>(url, options);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      return response.data;
    },
    ...mutationOptions,
    onSuccess: (...args) => {
      // Invalidate queries if specified
      if (mutationOptions.invalidateQueries) {
        const queriesToInvalidate = Array.isArray(mutationOptions.invalidateQueries)
          ? mutationOptions.invalidateQueries
          : [mutationOptions.invalidateQueries];

        queriesToInvalidate.forEach((queryKey: unknown[]) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Call original onSuccess if provided
      if (mutationOptions.onSuccess) {
        mutationOptions.onSuccess(...args);
      }
    },
  });
};

/**
 * Hook for making batch API requests
 * @param requests - Array of request configurations
 * @param options - Batch options
 * @returns Batch request state and functions
 */
export const useBatchApi = <T>(
  requests: Array<{
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data?: any;
    options?: ApiRequestOptions;
  }>,
  options: {
    executeOnMount?: boolean;
  } = {}
) => {
  // Request state
  const [state, setState] = useState<{
    data: T[] | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  // Execute batch function
  const execute = useCallback(async () => {
    // Set loading state
    setState({ data: null, loading: true, error: null });

    try {
      // Execute batch request
      const responses = await api.batch<T>(requests);

      // Update state with response data
      setState({
        data: responses.map(response => response.data),
        loading: false,
        error: null,
      });

      return responses.map(response => response.data);
    } catch (error) {
      // Update state with error
      setState({ data: null, loading: false, error });
      throw error;
    }
  }, [requests]);

  // Execute batch on mount if enabled
  useEffect(() => {
    if (options.executeOnMount) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    execute,
  };
};