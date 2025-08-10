/**
 * Utility functions for memoization of expensive computations
 */

/**
 * Creates a memoized version of a function that caches its results
 * @param fn - The function to memoize
 * @param getKey - Optional function to generate a cache key from the arguments
 * @returns A memoized version of the function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey(...args);
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Creates a memoized version of a function with a maximum cache size
 * @param fn - The function to memoize
 * @param maxSize - Maximum number of results to cache
 * @param getKey - Optional function to generate a cache key from the arguments
 * @returns A memoized version of the function
 */
export function memoizeWithMaxSize<T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 100,
  getKey: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  const cache = new Map<string, ReturnType<T>>();
  const keyTimestamps = new Map<string, number>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey(...args);
    if (cache.has(key)) {
      // Update timestamp for LRU tracking
      keyTimestamps.set(key, Date.now());
      return cache.get(key) as ReturnType<T>;
    }

    // Evict oldest entry if cache is full
    if (cache.size >= maxSize) {
      let oldestKey = '';
      let oldestTime = Infinity;

      keyTimestamps.forEach((time, k) => {
        if (time < oldestTime) {
          oldestTime = time;
          oldestKey = k;
        }
      });

      if (oldestKey) {
        cache.delete(oldestKey);
        keyTimestamps.delete(oldestKey);
      }
    }

    const result = fn(...args);
    cache.set(key, result);
    keyTimestamps.set(key, Date.now());
    return result;
  }) as T;
}

/**
 * Creates a memoized version of a function with a time-based expiration
 * @param fn - The function to memoize
 * @param maxAge - Maximum age of cached results in milliseconds
 * @param getKey - Optional function to generate a cache key from the arguments
 * @returns A memoized version of the function
 */
export function memoizeWithExpiration<T extends (...args: any[]) => any>(
  fn: T,
  maxAge: number = 60000, // Default: 1 minute
  getKey: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey(...args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  }) as T;
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation
 * @param fn - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function(...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      fn(...args);
    }, wait);
  };
}

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per every specified wait period
 * @param fn - The function to throttle
 * @param wait - The number of milliseconds to throttle invocations to
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function(...args: Parameters<T>): void {
    const now = Date.now();
    const remaining = wait - (now - lastCall);

    lastArgs = args;

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCall = now;
      fn(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        if (lastArgs) {
          fn(...lastArgs);
        }
      }, remaining);
    }
  };
}