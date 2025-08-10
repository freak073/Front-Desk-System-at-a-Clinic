/**
 * Utility functions for performance monitoring and optimization
 */

/**
 * Configuration for performance monitoring
 */
export const PERFORMANCE_CONFIG = {
  // Enable performance monitoring in development
  ENABLED_IN_DEV: true,
  // Performance budget thresholds (in milliseconds)
  THRESHOLDS: {
    // Time to first byte
    TTFB: 100,
    // First contentful paint
    FCP: 1000,
    // Largest contentful paint
    LCP: 2500,
    // First input delay
    FID: 100,
    // Cumulative layout shift
    CLS: 0.1,
    // Time to interactive
    TTI: 3000,
    // Total blocking time
    TBT: 300,
  },
  // Log level for performance monitoring
  LOG_LEVEL: 'warn', // 'debug' | 'info' | 'warn' | 'error' | 'none'
};

/**
 * Interface for performance metrics
 */
export interface PerformanceMetrics {
  // Navigation timing metrics
  navigationStart?: number;
  ttfb?: number;
  domContentLoaded?: number;
  windowLoaded?: number;
  // Web vitals
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  // Custom metrics
  componentRenderTime?: Record<string, number>;
  apiCallTime?: Record<string, number>;
  resourceLoadTime?: Record<string, number>;
}

// Singleton instance of performance metrics
let metrics: PerformanceMetrics = {};

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Skip if performance API is not available
  if (!window.performance) {
    console.warn('Performance API is not available in this browser');
    return;
  }

  // Skip in production if not enabled
  if (process.env.NODE_ENV === 'production' && !PERFORMANCE_CONFIG.ENABLED_IN_DEV) {
    return;
  }

  // Initialize metrics object
  metrics = {
    componentRenderTime: {},
    apiCallTime: {},
    resourceLoadTime: {},
  };

  // Collect navigation timing metrics
  collectNavigationTiming();

  // Collect web vitals
  collectWebVitals();

  // Monitor resource loading
  monitorResourceLoading();

  // Log initial metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      logPerformanceMetrics();
    }, 1000);
  });
}

/**
 * Collect navigation timing metrics
 */
function collectNavigationTiming(): void {
  if (!window.performance || !window.performance.timing) {
    return;
  }

  const timing = window.performance.timing;

  metrics.navigationStart = timing.navigationStart;
  metrics.ttfb = timing.responseStart - timing.navigationStart;
  metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
  
  // Window load event needs to be captured separately
  window.addEventListener('load', () => {
    metrics.windowLoaded = Date.now() - timing.navigationStart;
  });
}

/**
 * Collect web vitals metrics
 */
function collectWebVitals(): void {
  // First Contentful Paint (FCP)
  const fcpObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    if (entries.length > 0) {
      const fcp = entries[0];
      metrics.fcp = fcp.startTime;
      logMetric('FCP', fcp.startTime);
    }
  });
  
  try {
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch (e) {
    console.warn('FCP monitoring not supported', e);
  }

  // Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    metrics.lcp = lastEntry.startTime;
    logMetric('LCP', lastEntry.startTime);
  });
  
  try {
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    console.warn('LCP monitoring not supported', e);
  }

  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    if (entries.length > 0) {
      const firstInput = entries[0];
  const fi: any = firstInput as any;
  metrics.fid = (fi.processingStart || fi.startTime) - fi.startTime;
      logMetric('FID', metrics.fid);
    }
  });
  
  try {
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.warn('FID monitoring not supported', e);
  }

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];
  
  const clsObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    
    entries.forEach(entry => {
      // Only count layout shifts without recent user input
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
        clsEntries.push(entry);
      }
    });
    
    metrics.cls = clsValue;
    logMetric('CLS', clsValue);
  });
  
  try {
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('CLS monitoring not supported', e);
  }
}

/**
 * Monitor resource loading performance
 */
function monitorResourceLoading(): void {
  const resourceObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    
    entries.forEach(entry => {
      const resource = entry as PerformanceResourceTiming;
      const url = resource.name.split('/').pop() || resource.name;
      
      if (!metrics.resourceLoadTime) {
        metrics.resourceLoadTime = {};
      }
      
      metrics.resourceLoadTime[url] = resource.duration;
      
      // Log slow resource loads
      if (resource.duration > 1000) {
        logMetric(`Slow resource: ${url}`, resource.duration);
      }
    });
  });
  
  try {
    resourceObserver.observe({ type: 'resource', buffered: true });
  } catch (e) {
    console.warn('Resource monitoring not supported', e);
  }
}

/**
 * Measure component render time
 * @param componentName - Name of the component
 * @param callback - Function to measure
 * @returns Result of the callback function
 */
export function measureComponentRender<T>(componentName: string, callback: () => T): T {
  const startTime = performance.now();
  const result = callback();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (!metrics.componentRenderTime) {
    metrics.componentRenderTime = {};
  }
  
  metrics.componentRenderTime[componentName] = duration;
  
  // Log slow component renders
  if (duration > 50) {
    logMetric(`Slow component render: ${componentName}`, duration);
  }
  
  return result;
}

/**
 * Measure API call time
 * @param apiName - Name of the API call
 * @param callback - Async function to measure
 * @returns Promise resolving to the result of the callback function
 */
export async function measureApiCall<T>(
  apiName: string,
  callback: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await callback();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (!metrics.apiCallTime) {
      metrics.apiCallTime = {};
    }
    
    metrics.apiCallTime[apiName] = duration;
    
    // Log slow API calls
    if (duration > 500) {
      logMetric(`Slow API call: ${apiName}`, duration);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    logMetric(`Failed API call: ${apiName}`, duration);
    throw error;
  }
}

/**
 * Log a performance metric
 * @param metricName - Name of the metric
 * @param value - Value of the metric
 */
function logMetric(metricName: string, value: number): void {
  const { LOG_LEVEL, THRESHOLDS } = PERFORMANCE_CONFIG;
  
  // Skip logging if disabled
  if (LOG_LEVEL === 'none') {
    return;
  }
  
  // Determine if the metric exceeds its threshold
  let exceededThreshold = false;
  let threshold = 0;
  
  if (metricName === 'TTFB' && THRESHOLDS.TTFB) {
    exceededThreshold = value > THRESHOLDS.TTFB;
    threshold = THRESHOLDS.TTFB;
  } else if (metricName === 'FCP' && THRESHOLDS.FCP) {
    exceededThreshold = value > THRESHOLDS.FCP;
    threshold = THRESHOLDS.FCP;
  } else if (metricName === 'LCP' && THRESHOLDS.LCP) {
    exceededThreshold = value > THRESHOLDS.LCP;
    threshold = THRESHOLDS.LCP;
  } else if (metricName === 'FID' && THRESHOLDS.FID) {
    exceededThreshold = value > THRESHOLDS.FID;
    threshold = THRESHOLDS.FID;
  } else if (metricName === 'CLS' && THRESHOLDS.CLS) {
    exceededThreshold = value > THRESHOLDS.CLS;
    threshold = THRESHOLDS.CLS;
  }
  
  // Log based on log level and threshold
  if (exceededThreshold) {
    if (LOG_LEVEL === 'warn' || LOG_LEVEL === 'error') {
      console.warn(`Performance metric ${metricName} (${value.toFixed(2)}) exceeds threshold (${threshold})`);
    }
  } else if (LOG_LEVEL === 'debug') {
    console.debug(`Performance metric ${metricName}: ${value.toFixed(2)}`);
  } else if (LOG_LEVEL === 'info') {
    console.info(`Performance metric ${metricName}: ${value.toFixed(2)}`);
  }
}

/**
 * Log all collected performance metrics
 */
export function logPerformanceMetrics(): void {
  if (PERFORMANCE_CONFIG.LOG_LEVEL === 'none') {
    return;
  }
  
  console.group('Performance Metrics');
  
  // Navigation timing
  if (metrics.ttfb) {
    logMetric('TTFB', metrics.ttfb);
  }
  if (metrics.domContentLoaded) {
    logMetric('DOMContentLoaded', metrics.domContentLoaded);
  }
  if (metrics.windowLoaded) {
    logMetric('WindowLoaded', metrics.windowLoaded);
  }
  
  // Web vitals
  if (metrics.fcp) {
    logMetric('FCP', metrics.fcp);
  }
  if (metrics.lcp) {
    logMetric('LCP', metrics.lcp);
  }
  if (metrics.fid) {
    logMetric('FID', metrics.fid);
  }
  if (metrics.cls) {
    logMetric('CLS', metrics.cls);
  }
  
  // Component render times
  if (metrics.componentRenderTime && Object.keys(metrics.componentRenderTime).length > 0) {
    console.group('Component Render Times');
    Object.entries(metrics.componentRenderTime).forEach(([component, time]) => {
      console.log(`${component}: ${time.toFixed(2)}ms`);
    });
    console.groupEnd();
  }
  
  // API call times
  if (metrics.apiCallTime && Object.keys(metrics.apiCallTime).length > 0) {
    console.group('API Call Times');
    Object.entries(metrics.apiCallTime).forEach(([api, time]) => {
      console.log(`${api}: ${time.toFixed(2)}ms`);
    });
    console.groupEnd();
  }
  
  // Resource load times
  if (metrics.resourceLoadTime && Object.keys(metrics.resourceLoadTime).length > 0) {
    console.group('Slow Resource Load Times (>500ms)');
    Object.entries(metrics.resourceLoadTime)
      .filter(([_, time]) => time > 500)
      .sort((a, b) => b[1] - a[1])
      .forEach(([resource, time]) => {
        console.log(`${resource}: ${time.toFixed(2)}ms`);
      });
    console.groupEnd();
  }
  
  console.groupEnd();
}

/**
 * Get current performance metrics
 * @returns Copy of current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...metrics };
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics(): void {
  metrics = {
    componentRenderTime: {},
    apiCallTime: {},
    resourceLoadTime: {},
  };
}