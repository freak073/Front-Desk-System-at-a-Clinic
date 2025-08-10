import { QueryClient } from 'react-query';

/**
 * Cache configuration constants
 */
export const CACHE_CONFIG = {
  // Default stale time for queries (5 minutes)
  DEFAULT_STALE_TIME: 5 * 60 * 1000,
  
  // Default cache time for queries (30 minutes)
  DEFAULT_CACHE_TIME: 30 * 60 * 1000,
  
  // Short-lived cache for frequently changing data (30 seconds)
  SHORT_CACHE_TIME: 30 * 1000,
  
  // Long-lived cache for rarely changing data (1 hour)
  LONG_CACHE_TIME: 60 * 60 * 1000,
  
  // Maximum number of pages to keep in cache for paginated queries
  MAX_PAGES_IN_CACHE: 5,
};

/**
 * Cache key prefixes for different data types
 */
export const CACHE_KEYS = {
  QUEUE: 'queue',
  APPOINTMENTS: 'appointments',
  DOCTORS: 'doctors',
  PATIENTS: 'patients',
  DASHBOARD: 'dashboard',
  USER: 'user',
};

/**
 * Utility: build a paginated key
 */
export const paginatedKey = (base: string, page: number, pageSize: number, extra?: Record<string, any>) => [base, 'page', page, 'size', pageSize, extra || {}];

/**
 * Invalidate all doctor related queries (list + specific doctor) after schedule update
 */
export function invalidateDoctorRelated(queryClient: QueryClient, doctorId: number) {
  queryClient.invalidateQueries(CACHE_KEYS.DOCTORS);
  queryClient.invalidateQueries([CACHE_KEYS.DOCTORS, doctorId]);
}

/**
 * Creates a cache key with optional parameters
 * @param prefix - The cache key prefix
 * @param params - Additional parameters to include in the cache key
 * @returns A formatted cache key string or array
 */
export function createCacheKey(prefix: string, params?: Record<string, any> | string | number) {
  if (!params) {
    return prefix;
  }
  
  if (typeof params === 'string' || typeof params === 'number') {
    return [prefix, params.toString()];
  }
  
  return [prefix, params];
}

/**
 * Prefetches data and stores it in the cache
 * @param queryClient - The React Query client instance
 * @param queryKey - The cache key for the query
 * @param queryFn - The function to fetch the data
 * @param options - Additional options for the prefetch
 */
export async function prefetchQuery(
  queryClient: QueryClient,
  queryKey: string | unknown[],
  queryFn: () => Promise<any>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
  }
) {
  await queryClient.prefetchQuery(queryKey, queryFn, {
    staleTime: options?.staleTime || CACHE_CONFIG.DEFAULT_STALE_TIME,
    cacheTime: options?.cacheTime || CACHE_CONFIG.DEFAULT_CACHE_TIME,
  });
}

/**
 * Updates a cached item without refetching
 * @param queryClient - The React Query client instance
 * @param queryKey - The cache key for the query
 * @param updater - Function to update the cached data
 */
export function updateCachedData<T>(
  queryClient: QueryClient,
  queryKey: string | unknown[],
  updater: (oldData: T | undefined) => T
) {
  queryClient.setQueryData<T>(queryKey, (oldData) => updater(oldData));
}

/**
 * Invalidates queries based on a prefix to trigger refetching
 * @param queryClient - The React Query client instance
 * @param prefix - The cache key prefix to invalidate
 */
export function invalidateQueries(
  queryClient: QueryClient,
  prefix: string
) {
  queryClient.invalidateQueries(prefix);
}

/**
 * Creates a memoized selector for extracting specific data from cache
 * @param queryClient - The React Query client instance
 * @param queryKey - The cache key for the query
 * @param selector - Function to select specific data from the cache
 * @returns The selected data or undefined if not in cache
 */
export function selectFromCache<T, R>(
  queryClient: QueryClient,
  queryKey: string | unknown[],
  selector: (data: T) => R
): R | undefined {
  const cachedData = queryClient.getQueryData<T>(queryKey);
  if (!cachedData) return undefined;
  return selector(cachedData);
}