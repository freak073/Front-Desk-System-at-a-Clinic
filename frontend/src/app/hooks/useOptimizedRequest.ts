/**
 * React hooks for optimized API requests
 */

import { useCallback, useRef, useState } from 'react';
import { useQuery, useMutation, QueryKey, UseQueryOptions, UseMutationOptions } from 'react-query';
import {
  createOptimizedRequest,
  REQUEST_CONFIG,
  withRetry,
  dedupRequest
} from '../../lib/requestOptimization';
import { measureApiCall } from '../../lib/performanceMonitoring';

/**
 * Options for useOptimizedQuery hook
 */
export interface UseOptimizedQueryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, 'queryFn'> {
  // Enable request optimization
  enableOptimization?: boolean;
  // Enable request batching
  enableBatching?: boolean;
  // Enable request deduplication
  enableDedup?: boolean;
  // Enable request retry
  enableRetry?: boolean;
  // Time to cache deduplicated requests in milliseconds
  dedupCacheTime?: number;
  // Retry options
  retryOptions?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  };
  // Track API call performance
  trackPerformance?: boolean;
}

/**
 * Hook for making optimized API queries
 * @param queryKey - React Query key
 * @param fetchFn - Function to make the API request
 * @param params - Parameters for the API request
 * @param options - Query options
 * @returns React Query result
 */
export function useOptimizedQuery<TData, TError = unknown>(
  queryKey: QueryKey,
  fetchFn: (params: any) => Promise<TData>,
  params: any,
  options: UseOptimizedQueryOptions<TData, TError> = {}
) {
  const {
    enableOptimization = true,
    enableBatching = false,
    enableDedup = true,
    enableRetry = true,
    dedupCacheTime = REQUEST_CONFIG.DEFAULT_DEDUP_CACHE_TIME,
    retryOptions,
    trackPerformance = true,
    ...queryOptions
  } = options;

  // Create optimized fetch function
  const optimizedFetchFn = useCallback(
    (params: any) => {
      // Base fetch function
      let fetchFunction = fetchFn;

      // Wrap with performance tracking if enabled
      if (trackPerformance) {
        const apiName = Array.isArray(queryKey) ? queryKey.join('/') : String(queryKey);
        fetchFunction = (params: any) => measureApiCall(apiName, () => fetchFn(params));
      }

      // Apply optimization if enabled
      if (enableOptimization) {
        return createOptimizedRequest(fetchFunction, {
          enableBatching,
          enableDedup,
          enableRetry,
          dedupCacheTime,
          retryOptions,
        })(params);
      }

      return fetchFunction(params);
    },
    [queryKey, fetchFn, enableOptimization, enableBatching, enableDedup, enableRetry, dedupCacheTime, retryOptions, trackPerformance]
  );

  // Use React Query's useQuery with our optimized fetch function
  return useQuery<TData, TError>(
    // Include params in the query key for proper caching
    params ? [...(Array.isArray(queryKey) ? queryKey : [queryKey]), params] : queryKey,
    () => optimizedFetchFn(params),
    queryOptions
  );
}

/**
 * Options for useOptimizedMutation hook
 */
export interface UseOptimizedMutationOptions<TData, TError, TVariables> extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> {
  // Enable request retry
  enableRetry?: boolean;
  // Retry options
  retryOptions?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  };
  // Track API call performance
  trackPerformance?: boolean;
}

/**
 * Hook for making optimized API mutations
 * @param mutationFn - Function to make the API mutation
 * @param options - Mutation options
 * @returns React Query mutation result
 */
export function useOptimizedMutation<TData, TError = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseOptimizedMutationOptions<TData, TError, TVariables> = {}
) {
  const {
    enableRetry = true,
    retryOptions,
    trackPerformance = true,
    ...mutationOptions
  } = options;

  // Create optimized mutation function
  const optimizedMutationFn = useCallback(
    (variables: TVariables) => {
      // Base mutation function
      let mutationFunction = mutationFn;

      // Wrap with performance tracking if enabled
      if (trackPerformance) {
        const apiName = `mutation-${Date.now()}`;
        mutationFunction = (variables: TVariables) => measureApiCall(apiName, () => mutationFn(variables));
      }

      // Apply retry if enabled
      if (enableRetry) {
        return withRetry(
          mutationFunction,
          retryOptions?.maxRetries,
          retryOptions?.baseDelay,
          retryOptions?.maxDelay
        )(variables);
      }

      return mutationFunction(variables);
    },
    [mutationFn, enableRetry, retryOptions, trackPerformance]
  );

  // Use React Query's useMutation with our optimized mutation function
  return useMutation<TData, TError, TVariables>(
    optimizedMutationFn,
    mutationOptions
  );
}

/**
 * Hook for making optimized API requests with loading state
 * @param fetchFn - Function to make the API request
 * @param options - Options for request optimization
 * @returns Object with request function, loading state, error state, and data
 */
export function useOptimizedRequest<TData, TError = unknown>(
  fetchFn: (params: any) => Promise<TData>,
  options: {
    enableOptimization?: boolean;
    enableBatching?: boolean;
    enableDedup?: boolean;
    enableRetry?: boolean;
    dedupCacheTime?: number;
    retryOptions?: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
    };
    trackPerformance?: boolean;
    apiName?: string;
  } = {}
) {
  const {
    enableOptimization = true,
    enableBatching = false,
    enableDedup = true,
    enableRetry = true,
    dedupCacheTime = REQUEST_CONFIG.DEFAULT_DEDUP_CACHE_TIME,
    retryOptions,
    trackPerformance = true,
    apiName = 'api-request',
  } = options;

  // State for loading, error, and data
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TError | null>(null);
  const [data, setData] = useState<TData | null>(null);

  // Create optimized fetch function
  const optimizedFetchFn = useCallback(
    (params: any) => {
      // Base fetch function
      let fetchFunction = fetchFn;

      // Wrap with performance tracking if enabled
      if (trackPerformance) {
        fetchFunction = (params: any) => measureApiCall(apiName, () => fetchFn(params));
      }

      // Apply optimization if enabled
      if (enableOptimization) {
        return createOptimizedRequest(fetchFunction, {
          enableBatching,
          enableDedup,
          enableRetry,
          dedupCacheTime,
          retryOptions,
        })(params);
      }

      return fetchFunction(params);
    },
    [fetchFn, enableOptimization, enableBatching, enableDedup, enableRetry, dedupCacheTime, retryOptions, trackPerformance, apiName]
  );

  // Function to make the request
  const request = useCallback(
    async (params: any) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await optimizedFetchFn(params);
        setData(result);
        return result;
      } catch (err) {
        setError(err as TError);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [optimizedFetchFn]
  );

  return { request, isLoading, error, data };
}

/**
 * Hook for making concurrent optimized API requests
 * @param fetchFns - Object with functions to make API requests
 * @param options - Options for request optimization
 * @returns Object with request function, loading state, error state, and data
 */
export function useConcurrentRequests<T extends Record<string, (params: any) => Promise<any>>>(
  fetchFns: T,
  options: {
    enableOptimization?: boolean;
    enableDedup?: boolean;
    enableRetry?: boolean;
    trackPerformance?: boolean;
  } = {}
) {
  const {
    enableOptimization = true,
    enableDedup = true,
    enableRetry = true,
    trackPerformance = true,
  } = options;

  // State for loading, error, and data
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<keyof T, any>>({} as Record<keyof T, any>);
  const [data, setData] = useState<Record<keyof T, any>>({} as Record<keyof T, any>);

  // Create optimized fetch functions
  const optimizedFetchFns = useRef<Record<keyof T, (params: any) => Promise<any>>>({} as Record<keyof T, any>);

  // Initialize optimized fetch functions
  if (Object.keys(optimizedFetchFns.current).length === 0) {
    for (const key in fetchFns) {
      const fetchFn = fetchFns[key] as (params: any) => Promise<any>;
      let optimizedFn: (params: any) => Promise<any> = fetchFn;

      // Wrap with performance tracking if enabled
      if (trackPerformance) {
        optimizedFn = (params: any) => measureApiCall(`${String(key)}`, () => fetchFn(params));
      }

      // Apply optimization if enabled
      if (enableOptimization) {
        optimizedFn = createOptimizedRequest(optimizedFn, {
          enableBatching: false, // Batching not suitable for concurrent requests
          enableDedup,
          enableRetry,
        });
      }

  optimizedFetchFns.current[key] = optimizedFn as any;
    }
  }

  // Function to make concurrent requests
  const request = useCallback(
    async (paramsMap: Record<keyof T, any>) => {
      setIsLoading(true);
      setErrors({} as Record<keyof T, any>);

      const promises: Record<keyof T, Promise<any>> = {} as Record<keyof T, Promise<any>>;
      const newErrors: Record<keyof T, any> = {} as Record<keyof T, any>;
      const newData: Record<keyof T, any> = {} as Record<keyof T, any>;

      // Create promises for each request
      for (const key in optimizedFetchFns.current) {
        const params = paramsMap[key];
        promises[key] = optimizedFetchFns.current[key](params)
          .then((result) => {
            newData[key] = result;
            return result;
          })
          .catch((error) => {
            newErrors[key] = error;
            return null;
          });
      }

      // Wait for all promises to resolve
      await Promise.all(Object.values(promises));

      setData((prevData) => ({ ...prevData, ...newData }));
      setErrors(newErrors);
      setIsLoading(false);

      // If there are any errors, return them along with the data
      return { data: newData, errors: newErrors };
    },
    []
  );

  return { request, isLoading, errors, data };
}

/**
 * Example usage:
 * 
 * // Using useOptimizedQuery
 * const { data, isLoading, error } = useOptimizedQuery(
 *   ['users', { page: 1 }],
 *   fetchUsers,
 *   { page: 1, limit: 10 },
 *   { enableBatching: true }
 * );
 * 
 * // Using useOptimizedMutation
 * const { mutate, isLoading } = useOptimizedMutation(
 *   createUser,
 *   { onSuccess: () => queryClient.invalidateQueries('users') }
 * );
 * 
 * // Using useOptimizedRequest
 * const { request, isLoading, data } = useOptimizedRequest(fetchUsers);
 * const handleFetch = () => request({ page: 1, limit: 10 });
 * 
 * // Using useConcurrentRequests
 * const { request, isLoading, data } = useConcurrentRequests({
 *   users: fetchUsers,
 *   posts: fetchPosts,
 * });
 * const handleFetch = () => request({ users: { page: 1 }, posts: { userId: 1 } });
 */