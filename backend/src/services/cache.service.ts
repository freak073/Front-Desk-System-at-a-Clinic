/**
 * Cache service for optimizing database queries and API responses
 */

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as NodeCache from "node-cache";

/**
 * Cache options interface
 */
export interface CacheOptions {
  /** Cache key */
  key: string;
  /** Time-to-live in seconds */
  ttl?: number;
  /** Whether to refresh the cache on access */
  refreshOnAccess?: boolean;
}

/**
 * Service for caching data to optimize database queries and API responses
 */
@Injectable()
export class CacheService {
  private readonly cache: NodeCache;
  private readonly logger = new Logger("CacheService");
  private readonly defaultTtl: number;
  private readonly maxKeys: number;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.defaultTtl = this.configService.get<number>("CACHE_TTL", 300); // 5 minutes default
    this.maxKeys = this.configService.get<number>("CACHE_MAX_KEYS", 1000);
    this.enabled =
      this.configService.get<string>("CACHE_ENABLED", "true") === "true";

    this.cache = new NodeCache({
      stdTTL: this.defaultTtl,
      checkperiod: 60, // Check for expired keys every 60 seconds
      maxKeys: this.maxKeys,
      useClones: false, // For better performance
    });

    this.logger.log(
      `Cache initialized with TTL: ${this.defaultTtl}s, Max keys: ${this.maxKeys}, Enabled: ${this.enabled}`,
    );
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found
   */
  get<T>(key: string): T | null {
    if (!this.enabled) {
      return null;
    }

    const value = this.cache.get<T>(key);
    if (value) {
      this.logger.debug(`Cache hit: ${key}`);
    } else {
      this.logger.debug(`Cache miss: ${key}`);
    }
    return value || null;
  }

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time-to-live in seconds (optional)
   * @returns Success status
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (!this.enabled) {
      return false;
    }

    const success = this.cache.set(key, value, ttl || this.defaultTtl);
    this.logger.debug(`Cache set: ${key}, TTL: ${ttl || this.defaultTtl}s`);
    return success;
  }

  /**
   * Delete a value from cache
   * @param key - Cache key
   * @returns Success status
   */
  delete(key: string): boolean {
    if (!this.enabled) {
      return false;
    }

    const success = this.cache.del(key);
    this.logger.debug(`Cache delete: ${key}`);
    return success > 0;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    if (!this.enabled) {
      return;
    }

    this.cache.flushAll();
    this.logger.log("Cache cleared");
  }

  /**
   * Get cache stats
   * @returns Cache statistics
   */
  getStats(): NodeCache.Stats {
    return this.cache.getStats();
  }

  /**
   * Wrap a function with caching
   * @param options - Cache options
   * @param fn - Function to wrap
   * @returns Function result (cached or fresh)
   */
  async wrap<T>(options: CacheOptions, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return fn();
    }

    const { key, ttl, refreshOnAccess } = options;

    // Try to get from cache first
    const cachedValue = this.get<T>(key);
    if (cachedValue !== null) {
      // If refreshOnAccess is true, refresh the cache in the background
      if (refreshOnAccess) {
        this.refreshCache(key, fn, ttl).catch((err) => {
          this.logger.error(
            `Error refreshing cache for key ${key}: ${err.message}`,
          );
        });
      }
      return cachedValue;
    }

    // If not in cache, execute the function and cache the result
    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }

  /**
   * Refresh cache in the background
   * @param key - Cache key
   * @param fn - Function to get fresh data
   * @param ttl - Time-to-live in seconds
   */
  private async refreshCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<void> {
    try {
      const freshValue = await fn();
      this.set(key, freshValue, ttl);
      this.logger.debug(`Cache refreshed in background: ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to refresh cache for key ${key}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate a cache key from parameters
   * @param prefix - Key prefix
   * @param params - Parameters to include in the key
   * @returns Generated cache key
   */
  generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort((a, b) => a.localeCompare(b))
      .reduce(
        (result, key) => {
          // Skip null or undefined values
          if (params[key] !== null && params[key] !== undefined) {
            result[key] = params[key];
          }
          return result;
        },
        {} as Record<string, any>,
      );

    const paramString =
      Object.keys(sortedParams).length > 0
        ? `:${JSON.stringify(sortedParams)}`
        : "";

    return `${prefix}${paramString}`;
  }

  /**
   * Cache with automatic invalidation based on tags
   */
  private taggedCache = new Map<string, Set<string>>();

  /**
   * Set value with tags for group invalidation
   * @param key - Cache key
   * @param value - Value to cache
   * @param tags - Tags for group invalidation
   * @param ttl - Time-to-live in seconds
   */
  setWithTags<T>(key: string, value: T, tags: string[], ttl?: number): boolean {
    if (!this.enabled) {
      return false;
    }

    const success = this.set(key, value, ttl);
    
    if (success) {
      // Associate key with tags
      tags.forEach(tag => {
        if (!this.taggedCache.has(tag)) {
          this.taggedCache.set(tag, new Set());
        }
        this.taggedCache.get(tag)!.add(key);
      });
    }
    
    return success;
  }

  /**
   * Invalidate all cache entries with specific tags
   * @param tags - Tags to invalidate
   */
  invalidateByTags(tags: string[]): void {
    if (!this.enabled) {
      return;
    }

    const keysToDelete = new Set<string>();
    
    tags.forEach(tag => {
      const taggedKeys = this.taggedCache.get(tag);
      if (taggedKeys) {
        taggedKeys.forEach(key => keysToDelete.add(key));
        this.taggedCache.delete(tag);
      }
    });

    keysToDelete.forEach(key => this.delete(key));
    this.logger.debug(`Invalidated ${keysToDelete.size} cache entries for tags: ${tags.join(', ')}`);
  }

  /**
   * Multi-level cache with L1 (memory) and L2 (persistent) support
   */
  async getMultiLevel<T>(key: string): Promise<T | null> {
    // L1 cache (memory)
    const l1Value = this.get<T>(key);
    if (l1Value !== null) {
      return l1Value;
    }

    // L2 cache would be implemented here (Redis, file system, etc.)
    // For now, just return null
    return null;
  }

  /**
   * Set value in multi-level cache
   */
  async setMultiLevel<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    // Set in L1 cache
    const l1Success = this.set(key, value, ttl);
    
    // L2 cache would be implemented here
    // For now, just return L1 result
    return l1Success;
  }

  /**
   * Batch operations for better performance
   */
  mget<T>(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    
    if (!this.enabled) {
      return results;
    }

    keys.forEach(key => {
      const value = this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    });

    return results;
  }

  /**
   * Set multiple values at once
   */
  mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): boolean {
    if (!this.enabled) {
      return false;
    }

    let allSuccess = true;
    entries.forEach(({ key, value, ttl }) => {
      const success = this.set(key, value, ttl);
      if (!success) {
        allSuccess = false;
      }
    });

    return allSuccess;
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warmCache(warmingFunctions: Array<{
    key: string;
    fn: () => Promise<any>;
    ttl?: number;
    tags?: string[];
  }>): Promise<void> {
    this.logger.log(`Warming cache with ${warmingFunctions.length} entries`);
    
    const promises = warmingFunctions.map(async ({ key, fn, ttl, tags }) => {
      try {
        const value = await fn();
        if (tags) {
          this.setWithTags(key, value, tags, ttl);
        } else {
          this.set(key, value, ttl);
        }
      } catch (error) {
        this.logger.error(`Failed to warm cache for key ${key}: ${error.message}`);
      }
    });

    await Promise.allSettled(promises);
    this.logger.log('Cache warming completed');
  }

  /**
   * Get cache hit ratio for monitoring
   */
  getHitRatio(): number {
    const stats = this.getStats();
    const total = stats.hits + stats.misses;
    return total > 0 ? stats.hits / total : 0;
  }

  /**
   * Monitor cache performance
   */
  getPerformanceMetrics(): {
    hitRatio: number;
    keyCount: number;
    memoryUsage: number;
    stats: NodeCache.Stats;
  } {
    const stats = this.getStats();
    return {
      hitRatio: this.getHitRatio(),
      keyCount: stats.keys,
      memoryUsage: process.memoryUsage().heapUsed,
      stats,
    };
  }
}
