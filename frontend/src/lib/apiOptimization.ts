/**
 * API optimization utilities for improving frontend performance
 */

import { measureApiCall } from './performanceMonitoring';

/**
 * API optimization configuration
 */
export const API_CONFIG = {
  /** Base URL for API requests */
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  /** Default timeout for requests in milliseconds */
  defaultTimeout: 10000,
  /** Default number of retry attempts */
  defaultRetryAttempts: 3,
  /** Default retry delay in milliseconds */
  defaultRetryDelay: 1000,
  /** Default batch size for request batching */
  defaultBatchSize: 10,
  /** Default batch delay in milliseconds */
  defaultBatchDelay: 50,
  /** Default cache TTL in milliseconds */
  defaultCacheTtl: 5 * 60 * 1000, // 5 minutes
  /** Enable request optimization by default */
  enableOptimization: true,
};

/**
 * API request options
 */
export interface ApiRequestOptions extends RequestInit {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  retryAttempts?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Enable request caching */
  cache?: boolean;
  /** Cache TTL in milliseconds */
  cacheTtl?: number;
  /** Request ID for batching */
  batchId?: string;
  /** Skip performance tracking */
  skipPerformanceTracking?: boolean;
}

/**
 * API response with metadata
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** Response status */
  status: number;
  /** Response headers */
  headers: Headers;
  /** Response metadata */
  meta: {
    /** Request duration in milliseconds */
    duration: number;
    /** Request URL */
    url: string;
    /** Request method */
    method: string;
    /** Whether the response was cached */
    fromCache: boolean;
    /** Number of retry attempts */
    retryCount: number;
  };
}

/**
 * In-memory cache for API responses
 */
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * Batch request queue
 */
interface BatchQueue {
  [key: string]: {
    requests: { url: string; options: ApiRequestOptions; resolve: Function; reject: Function }[];
    timer: NodeJS.Timeout | null;
  };
}

const batchQueue: BatchQueue = {};

/**
 * Generate a cache key for an API request
 * @param url - Request URL
 * @param options - Request options
 * @returns Cache key
 */
const generateCacheKey = (url: string, options: ApiRequestOptions): string => {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
};

/**
 * Check if a cached response is still valid
 * @param cacheEntry - Cache entry
 * @returns Whether the cache entry is valid
 */
const isCacheValid = (cacheEntry: { timestamp: number; ttl: number }): boolean => {
  return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
};

/**
 * Make an API request with optimization
 * @param url - Request URL
 * @param options - Request options
 * @returns API response
 */
export const apiRequest = async <T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> => {
  // Start performance tracking
  const apiName = `${options.method || 'GET'} ${url.split('?')[0]}`;
  const trackingEnabled = !options.skipPerformanceTracking;
  const trackingId = trackingEnabled ? measureApiCall(apiName, 'start') : null;

  try {
    // Apply default options
    const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.baseUrl}${url}`;
    const fullOptions: ApiRequestOptions = {
      ...options,
      timeout: options.timeout || API_CONFIG.defaultTimeout,
      retryAttempts: options.retryAttempts || API_CONFIG.defaultRetryAttempts,
      retryDelay: options.retryDelay || API_CONFIG.defaultRetryDelay,
      cache: options.cache !== undefined ? options.cache : (options.method || 'GET') === 'GET',
      cacheTtl: options.cacheTtl || API_CONFIG.defaultCacheTtl,
    };

    // Check cache for GET requests
    if (fullOptions.cache && (fullOptions.method || 'GET') === 'GET') {
      const cacheKey = generateCacheKey(fullUrl, fullOptions);
      const cachedResponse = apiCache.get(cacheKey);

      if (cachedResponse && isCacheValid(cachedResponse)) {
        // End performance tracking for cached response
        if (trackingId) {
          measureApiCall(apiName, 'end', trackingId, { fromCache: true });
        }

        return {
          data: cachedResponse.data,
          status: 200,
          headers: new Headers(),
          meta: {
            duration: 0,
            url: fullUrl,
            method: fullOptions.method || 'GET',
            fromCache: true,
            retryCount: 0,
          },
        };
      }
    }

    // Check if this request should be batched
    if (fullOptions.batchId) {
      return new Promise((resolve, reject) => {
        // Add to batch queue
        if (!batchQueue[fullOptions.batchId!]) {
          batchQueue[fullOptions.batchId!] = {
            requests: [],
            timer: null,
          };
        }

        // Add request to queue
        batchQueue[fullOptions.batchId!].requests.push({
          url: fullUrl,
          options: fullOptions,
          resolve,
          reject,
        });

        // Set timer to process batch
        if (!batchQueue[fullOptions.batchId!].timer) {
          batchQueue[fullOptions.batchId!].timer = setTimeout(() => {
            processBatch(fullOptions.batchId!);
          }, API_CONFIG.defaultBatchDelay);
        }
      });
    }

    // Make the request with retries
    const startTime = Date.now();
    const response = await makeRequestWithRetry<T>(fullUrl, fullOptions);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Cache successful GET responses
    if (
      fullOptions.cache &&
      (fullOptions.method || 'GET') === 'GET' &&
      response.status >= 200 &&
      response.status < 300
    ) {
      const cacheKey = generateCacheKey(fullUrl, fullOptions);
      apiCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
        ttl: fullOptions.cacheTtl!,
      });
    }

    // End performance tracking
    if (trackingId) {
      measureApiCall(apiName, 'end', trackingId, {
        status: response.status,
        duration,
      });
    }

    return {
      ...response,
      meta: {
        ...response.meta,
        duration,
      },
    };
  } catch (error) {
    // End performance tracking with error
    if (trackingId) {
      measureApiCall(apiName, 'end', trackingId, { error: error.message });
    }
    throw error;
  }
};

/**
 * Make an API request with retry logic
 * @param url - Request URL
 * @param options - Request options
 * @returns API response
 */
const makeRequestWithRetry = async <T>(
  url: string,
  options: ApiRequestOptions
): Promise<ApiResponse<T>> => {
  let lastError: Error | null = null;
  let retryCount = 0;

  while (retryCount <= options.retryAttempts!) {
    try {
      const response = await makeRequestWithTimeout<T>(url, options);

      // Return successful response
      return {
        ...response,
        meta: {
          ...response.meta,
          retryCount,
        },
      };
    } catch (error) {
      lastError = error;

      // Don't retry if it's a client error (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Don't retry if we've reached the maximum attempts
      if (retryCount >= options.retryAttempts!) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay =
        options.retryDelay! * Math.pow(2, retryCount) +
        Math.floor(Math.random() * 100);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      retryCount++;
    }
  }

  // This should never happen, but TypeScript requires a return
  throw lastError || new Error('Unknown error');
};

/**
 * Make an API request with timeout
 * @param url - Request URL
 * @param options - Request options
 * @returns API response
 */
const makeRequestWithTimeout = async <T>(
  url: string,
  options: ApiRequestOptions
): Promise<ApiResponse<T>> => {
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);

  try {
    // Make the request
    const fetchOptions: RequestInit = {
      ...options,
      signal: controller.signal,
    };

    const response = await fetch(url, fetchOptions);
    const responseData = await getResponseData<T>(response);

    // Check if response is ok
    if (!response.ok) {
      const error: any = new Error(
        responseData.message || `API error: ${response.status}`
      );
      error.status = response.status;
      error.data = responseData;
      throw error;
    }

    return {
      data: responseData,
      status: response.status,
      headers: response.headers,
      meta: {
        duration: 0, // Will be calculated later
        url,
        method: options.method || 'GET',
        fromCache: false,
        retryCount: 0, // Will be updated later
      },
    };
  } catch (error) {
    // Handle timeout
    if (error.name === 'AbortError') {
      const timeoutError: any = new Error(`Request timeout after ${options.timeout}ms`);
      timeoutError.status = 408; // Request Timeout
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Get response data based on content type
 * @param response - Fetch response
 * @returns Response data
 */
const getResponseData = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return response.json();
  } else if (contentType?.includes('text/')) {
    return response.text() as unknown as T;
  } else {
    // For binary data, return blob
    return response.blob() as unknown as T;
  }
};

/**
 * Process a batch of requests
 * @param batchId - Batch ID
 */
const processBatch = async (batchId: string) => {
  const batch = batchQueue[batchId];
  if (!batch) return;

  // Clear the timer
  if (batch.timer) {
    clearTimeout(batch.timer);
    batch.timer = null;
  }

  // Process requests in chunks
  const requests = [...batch.requests];
  batch.requests = [];

  // Process in chunks of defaultBatchSize
  for (let i = 0; i < requests.length; i += API_CONFIG.defaultBatchSize) {
    const chunk = requests.slice(i, i + API_CONFIG.defaultBatchSize);

    // Process chunk in parallel
    await Promise.all(
      chunk.map(async ({ url, options, resolve, reject }) => {
        try {
          // Remove batchId to prevent infinite recursion
          const { batchId, ...restOptions } = options;
          const response = await apiRequest(url, restOptions);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      })
    );
  }

  // Delete batch from queue
  delete batchQueue[batchId];
};

/**
 * Clear the API cache
 * @param urlPattern - Optional URL pattern to clear specific cache entries
 */
export const clearApiCache = (urlPattern?: string | RegExp) => {
  if (!urlPattern) {
    apiCache.clear();
    return;
  }

  const pattern = urlPattern instanceof RegExp ? urlPattern : new RegExp(urlPattern);
  
  // Clear matching cache entries
  for (const key of apiCache.keys()) {
    if (pattern.test(key)) {
      apiCache.delete(key);
    }
  }
};

/**
 * Get API cache statistics
 * @returns Cache statistics
 */
export const getApiCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  let totalSize = 0;

  for (const [key, entry] of apiCache.entries()) {
    if (isCacheValid(entry)) {
      validEntries++;
    } else {
      expiredEntries++;
    }

    // Estimate size in bytes (rough approximation)
    totalSize += key.length * 2; // Key size (2 bytes per character)
    totalSize += JSON.stringify(entry.data).length * 2; // Data size
    totalSize += 16; // Timestamp and TTL (8 bytes each)
  }

  return {
    totalEntries: apiCache.size,
    validEntries,
    expiredEntries,
    totalSizeBytes: totalSize,
    totalSizeKB: Math.round(totalSize / 1024),
  };
};

/**
 * Create an optimized API client
 * @param baseUrl - Base URL for API requests
 * @param defaultOptions - Default request options
 * @returns Optimized API client
 */
export const createApiClient = (baseUrl?: string, defaultOptions: ApiRequestOptions = {}) => {
  const client = {
    /**
     * Make a GET request
     * @param url - Request URL
     * @param options - Request options
     * @returns API response
     */
    get: <T>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
      return apiRequest<T>(url, {
        ...defaultOptions,
        ...options,
        method: 'GET',
      });
    },

    /**
     * Make a POST request
     * @param url - Request URL
     * @param data - Request data
     * @param options - Request options
     * @returns API response
     */
    post: <T>(url: string, data: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
      return apiRequest<T>(url, {
        ...defaultOptions,
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          ...defaultOptions.headers,
          ...options.headers,
        },
      });
    },

    /**
     * Make a PUT request
     * @param url - Request URL
     * @param data - Request data
     * @param options - Request options
     * @returns API response
     */
    put: <T>(url: string, data: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
      return apiRequest<T>(url, {
        ...defaultOptions,
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          ...defaultOptions.headers,
          ...options.headers,
        },
      });
    },

    /**
     * Make a PATCH request
     * @param url - Request URL
     * @param data - Request data
     * @param options - Request options
     * @returns API response
     */
    patch: <T>(url: string, data: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
      return apiRequest<T>(url, {
        ...defaultOptions,
        ...options,
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          ...defaultOptions.headers,
          ...options.headers,
        },
      });
    },

    /**
     * Make a DELETE request
     * @param url - Request URL
     * @param options - Request options
     * @returns API response
     */
    delete: <T>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
      return apiRequest<T>(url, {
        ...defaultOptions,
        ...options,
        method: 'DELETE',
      });
    },

    /**
     * Make a batch of requests
     * @param requests - Array of request configurations
     * @returns Array of API responses
     */
    batch: async <T>(
      requests: Array<{
        url: string;
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        data?: any;
        options?: ApiRequestOptions;
      }>
    ): Promise<Array<ApiResponse<T>>> => {
      const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

      return Promise.all(
        requests.map(({ url, method, data, options = {} }) => {
          const fullUrl = url.startsWith('http') ? url : `${baseUrl || API_CONFIG.baseUrl}${url}`;

          // Prepare options based on method
          const requestOptions: ApiRequestOptions = {
            ...defaultOptions,
            ...options,
            method,
            batchId,
          };

          // Add body for methods that support it
          if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            requestOptions.body = JSON.stringify(data);
            requestOptions.headers = {
              'Content-Type': 'application/json',
              ...defaultOptions.headers,
              ...options.headers,
            };
          }

          return apiRequest<T>(fullUrl, requestOptions);
        })
      );
    },

    /**
     * Clear the API cache
     * @param urlPattern - Optional URL pattern to clear specific cache entries
     */
    clearCache: (urlPattern?: string | RegExp) => clearApiCache(urlPattern),

    /**
     * Get API cache statistics
     * @returns Cache statistics
     */
    getCacheStats: () => getApiCacheStats(),
  };

  return client;
};

/**
 * Default API client instance
 */
export const api = createApiClient();