/**
 * Utility functions for optimizing API requests
 */

/**
 * Configuration for request optimization
 */
export const REQUEST_CONFIG = {
  // Default batch window in milliseconds
  DEFAULT_BATCH_WINDOW: 50,
  // Maximum batch size
  MAX_BATCH_SIZE: 20,
  // Default cache time for request deduplication in milliseconds
  DEFAULT_DEDUP_CACHE_TIME: 2000,
  // Default retry configuration
  RETRY: {
    // Maximum number of retries
    MAX_RETRIES: 3,
    // Base delay between retries in milliseconds
    BASE_DELAY: 300,
    // Maximum delay between retries in milliseconds
    MAX_DELAY: 5000,
  },
};

/**
 * Interface for batch request
 */
export interface BatchRequest<T> {
  id: string;
  params: any;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
}

/**
 * Interface for batch processor options
 */
export interface BatchProcessorOptions {
  // Time window to collect requests before processing
  batchWindow?: number;
  // Maximum number of requests in a batch
  maxBatchSize?: number;
  // Function to generate request ID for deduplication
  getRequestId?: (params: any) => string;
}

/**
 * Creates a batch processor for API requests
 * @param batchFn - Function to process a batch of requests
 * @param options - Batch processor options
 * @returns Function to add a request to the batch
 */
export function createBatchProcessor<T>(
  batchFn: (requests: BatchRequest<T>[]) => Promise<void>,
  options: BatchProcessorOptions = {}
): (params: any) => Promise<T> {
  const {
    batchWindow = REQUEST_CONFIG.DEFAULT_BATCH_WINDOW,
    maxBatchSize = REQUEST_CONFIG.MAX_BATCH_SIZE,
    getRequestId = JSON.stringify,
  } = options;

  let batch: BatchRequest<T>[] = [];
  let timeout: NodeJS.Timeout | null = null;

  // Process the current batch
  const processBatch = async () => {
    const currentBatch = [...batch];
    batch = [];
    timeout = null;

    try {
      await batchFn(currentBatch);
    } catch (error) {
      // If batch processing fails, reject all requests
      currentBatch.forEach((request) => {
        request.reject(error);
      });
    }
  };

  // Add a request to the batch
  return (params: any): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      // Create a unique ID for this request for potential deduplication
      const id = getRequestId(params);

      // Check if there's already an identical request in the batch
      const existingRequest = batch.find((request) => request.id === id);
      if (existingRequest) {
        // Attach to the existing request instead of creating a new one
        const originalResolve = existingRequest.resolve;
        existingRequest.resolve = (value) => {
          originalResolve(value);
          resolve(value);
        };
        return;
      }

      // Add the request to the batch
      batch.push({ id, params, resolve, reject });

      // If we've reached the maximum batch size, process immediately
      if (batch.length >= maxBatchSize) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        processBatch();
        return;
      }

      // Otherwise, set a timeout to process the batch
      if (!timeout) {
        timeout = setTimeout(processBatch, batchWindow);
      }
    });
  };
}

/**
 * Cache for request deduplication
 */
interface DedupCacheEntry<T> {
  promise: Promise<T>;
  timestamp: number;
}

const dedupCache = new Map<string, DedupCacheEntry<any>>();

/**
 * Periodically clean up expired cache entries
 */
setInterval(() => {
  const now = Date.now();
  dedupCache.forEach((entry, key) => {
    if (now - entry.timestamp > REQUEST_CONFIG.DEFAULT_DEDUP_CACHE_TIME) {
      dedupCache.delete(key);
    }
  });
}, REQUEST_CONFIG.DEFAULT_DEDUP_CACHE_TIME);

/**
 * Creates a deduplicating wrapper for API requests
 * @param fetchFn - Function to make the API request
 * @param cacheTime - Time to cache the request in milliseconds
 * @returns Deduplicating wrapper function
 */
export function dedupRequest<T>(
  fetchFn: (params: any) => Promise<T>,
  cacheTime = REQUEST_CONFIG.DEFAULT_DEDUP_CACHE_TIME
): (params: any) => Promise<T> {
  return (params: any): Promise<T> => {
    // Create a cache key from the parameters
    const cacheKey = JSON.stringify(params);

    // Check if we have a cached promise for this request
    const cached = dedupCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.promise;
    }

    // Make the request and cache the promise
    const promise = fetchFn(params);
    dedupCache.set(cacheKey, {
      promise,
      timestamp: Date.now(),
    });

    // Remove from cache if the request fails
    promise.catch(() => {
      dedupCache.delete(cacheKey);
    });

    return promise;
  };
}

/**
 * Creates a retry wrapper for API requests with exponential backoff
 * @param fetchFn - Function to make the API request
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay between retries in milliseconds
 * @param maxDelay - Maximum delay between retries in milliseconds
 * @returns Retry wrapper function
 */
export function withRetry<T>(
  fetchFn: (params: any) => Promise<T>,
  maxRetries = REQUEST_CONFIG.RETRY.MAX_RETRIES,
  baseDelay = REQUEST_CONFIG.RETRY.BASE_DELAY,
  maxDelay = REQUEST_CONFIG.RETRY.MAX_DELAY
): (params: any) => Promise<T> {
  return async (params: any): Promise<T> => {
    let retries = 0;

    while (true) {
      try {
        return await fetchFn(params);
      } catch (error) {
        // Don't retry if we've reached the maximum number of retries
        if (retries >= maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          maxDelay,
          baseDelay * Math.pow(2, retries) * (0.5 + Math.random() * 0.5)
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        retries++;
      }
    }
  };
}

/**
 * Creates an optimized API request function with batching, deduplication, and retry
 * @param fetchFn - Function to make the API request
 * @param options - Options for request optimization
 * @returns Optimized API request function
 */
export function createOptimizedRequest<T>(
  fetchFn: (params: any) => Promise<T>,
  options: {
    enableBatching?: boolean;
    enableDedup?: boolean;
    enableRetry?: boolean;
    batchOptions?: BatchProcessorOptions;
    dedupCacheTime?: number;
    retryOptions?: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
    };
  } = {}
): (params: any) => Promise<T> {
  const {
    enableBatching = false,
    enableDedup = true,
    enableRetry = true,
    batchOptions,
    dedupCacheTime = REQUEST_CONFIG.DEFAULT_DEDUP_CACHE_TIME,
    retryOptions = {},
  } = options;

  let optimizedFn = fetchFn;

  // Apply retry wrapper
  if (enableRetry) {
    const { maxRetries, baseDelay, maxDelay } = retryOptions;
    optimizedFn = withRetry(
      optimizedFn,
      maxRetries,
      baseDelay,
      maxDelay
    );
  }

  // Apply deduplication wrapper
  if (enableDedup) {
    optimizedFn = dedupRequest(optimizedFn, dedupCacheTime);
  }

  // Apply batching wrapper
  if (enableBatching) {
    // Create a batch processor that calls the optimized function for each request
    const batchProcessor = createBatchProcessor<T>(
      async (requests) => {
        // Process each request individually
        await Promise.all(
          requests.map(async (request) => {
            try {
              const result = await optimizedFn(request.params);
              request.resolve(result);
            } catch (error) {
              request.reject(error);
            }
          })
        );
      },
      batchOptions
    );

    return batchProcessor;
  }

  return optimizedFn;
}

/**
 * Example usage:
 * 
 * // Create an optimized API request function
 * const fetchUsers = createOptimizedRequest(
 *   async (params) => {
 *     const response = await fetch(`/api/users?${new URLSearchParams(params)}`);
 *     return response.json();
 *   },
 *   {
 *     enableBatching: true,
 *     enableDedup: true,
 *     enableRetry: true,
 *   }
 * );
 * 
 * // Use the optimized function
 * const users = await fetchUsers({ page: 1, limit: 10 });
 */