/**
 * Utility functions for dynamic imports and code splitting
 */

import { lazy, ComponentType } from 'react';

/**
 * Configuration for dynamic imports
 */
export const DYNAMIC_IMPORT_CONFIG = {
  // Default timeout for dynamic imports (ms)
  DEFAULT_TIMEOUT: 10000,
  // Retry count for failed imports
  RETRY_COUNT: 3,
  // Delay between retries (ms)
  RETRY_DELAY: 1000,
};

/**
 * Interface for dynamic import options
 */
export interface DynamicImportOptions {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
}

/**
 * Create a promise with timeout
 * @param promise - The promise to add timeout to
 * @param timeout - Timeout in milliseconds
 * @param timeoutError - Error to throw on timeout
 * @returns Promise with timeout
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  timeoutError: Error = new Error('Dynamic import timed out')
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(timeoutError);
    }, timeout);

    promise
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Retry a promise with exponential backoff
 * @param fn - Function that returns a promise
 * @param retries - Number of retries
 * @param delay - Initial delay in milliseconds
 * @returns Promise with retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, delay));

    // Retry with exponential backoff
    return withRetry(fn, retries - 1, delay * 2);
  }
}

/**
 * Dynamically import a module with timeout and retry
 * @param importFn - Dynamic import function
 * @param options - Import options
 * @returns Promise resolving to the imported module
 */
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  options: DynamicImportOptions = {}
): Promise<T> {
  const {
    timeout = DYNAMIC_IMPORT_CONFIG.DEFAULT_TIMEOUT,
    retryCount = DYNAMIC_IMPORT_CONFIG.RETRY_COUNT,
    retryDelay = DYNAMIC_IMPORT_CONFIG.RETRY_DELAY,
    onError,
  } = options;

  try {
    // Add timeout and retry logic to the import
    return await withTimeout(
      withRetry(importFn, retryCount, retryDelay),
      timeout
    );
  } catch (error) {
    // Call error handler if provided
    if (onError && error instanceof Error) {
      onError(error);
    }
    throw error;
  }
}

/**
 * Dynamically import a React component with timeout and retry
 * @param importFn - Dynamic import function for a React component
 * @param options - Import options
 * @returns Lazy-loaded React component
 */
export function dynamicComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: DynamicImportOptions = {}
): React.LazyExoticComponent<T> {
  // Create a wrapped import function with timeout and retry
  const wrappedImport = () => dynamicImport(importFn, options);
  
  // Use React.lazy with the wrapped import
  return lazy(wrappedImport);
}

/**
 * Preload a component to improve perceived performance
 * @param importFn - Dynamic import function
 * @param options - Import options
 */
export function preloadComponent<T>(
  importFn: () => Promise<T>,
  options: DynamicImportOptions = {}
): void {
  // Start the import but don't wait for it
  dynamicImport(importFn, options).catch(() => {
    // Silently ignore preload errors
  });
}

/**
 * Preload multiple components in parallel
 * @param importFns - Array of dynamic import functions
 * @param options - Import options
 */
export function preloadComponents(
  importFns: Array<() => Promise<any>>,
  options: DynamicImportOptions = {}
): void {
  importFns.forEach(importFn => preloadComponent(importFn, options));
}