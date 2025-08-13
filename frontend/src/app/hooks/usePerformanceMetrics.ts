import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentMountTime: number;
  apiResponseTime: number;
  memoryUsage: number;
}

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
}

export function usePerformanceMetrics(componentName: string) {
  const mountTimeRef = useRef<number>(Date.now());
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    componentMountTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
  });

  // Measure component mount time
  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current;
    metricsRef.current.componentMountTime = mountTime;

    // Log slow component mounts
    if (mountTime > 100) {
      console.warn(`Slow component mount: ${componentName} took ${mountTime}ms`);
    }
  }, [componentName]);

  // Measure render performance
  const measureRender = useCallback((renderStart: number) => {
    const renderTime = Date.now() - renderStart;
    metricsRef.current.renderTime = renderTime;

    if (renderTime > 16) { // 60fps threshold
      console.warn(`Slow render: ${componentName} took ${renderTime}ms`);
    }
  }, [componentName]);

  // Measure API response time
  const measureApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    apiName: string
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const responseTime = Date.now() - startTime;
      metricsRef.current.apiResponseTime = responseTime;

      // Log slow API calls
      if (responseTime > 2000) {
        console.warn(`Slow API call: ${apiName} took ${responseTime}ms`);
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`API call failed: ${apiName} took ${responseTime}ms`, error);
      throw error;
    }
  }, []);

  // Measure memory usage
  const measureMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      metricsRef.current.memoryUsage = memory.usedJSHeapSize;
      
      // Warn about high memory usage (>50MB)
      if (memory.usedJSHeapSize > 50 * 1024 * 1024) {
        console.warn(`High memory usage: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
      }
    }
  }, []);

  // Get performance metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    measureMemoryUsage();
    return { ...metricsRef.current };
  }, [measureMemoryUsage]);

  // Report metrics to monitoring service
  const reportMetrics = useCallback(() => {
    const metrics = getMetrics();
    
    // In a real app, this would send to a monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance metrics for ${componentName}:`, metrics);
    }
  }, [componentName, getMetrics]);

  return {
    measureRender,
    measureApiCall,
    measureMemoryUsage,
    getMetrics,
    reportMetrics,
  };
}

// Hook for measuring Web Vitals
export function useWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return; // Early return is fine inside useEffect
    }

    // Measure Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: PerformanceEntry) => {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            console.log('LCP:', entry.startTime);
            break;
          case 'first-input':
            console.log('FID:', entry.duration);
            break;
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              console.log('CLS:', (entry as any).value);
            }
            break;
        }
      });
    });

    // Observe different performance entry types
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      // Fallback for browsers that don't support all entry types
      console.warn('Some performance metrics not supported:', error);
    }

    return () => observer.disconnect();
  }, []);

  // Always return something from the hook to maintain consistency
  return null;
}

// Hook for monitoring bundle size and loading performance
export function useBundleMetrics() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return; // Early return is fine inside useEffect
    }

    // Measure resource loading times
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: PerformanceEntry) => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          const loadTime = entry.duration;
          if (loadTime > 1000) {
            console.warn(`Slow resource load: ${entry.name} took ${loadTime}ms`);
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource timing not supported:', error);
    }

    return () => observer.disconnect();
  }, []);

  const getBundleSize = useCallback(() => {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return {
        totalSize: 0,
        jsSize: 0,
        cssSize: 0,
      };
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;

    resources.forEach((resource) => {
      if (resource.transferSize) {
        totalSize += resource.transferSize;
        
        if (resource.name.includes('.js')) {
          jsSize += resource.transferSize;
        } else if (resource.name.includes('.css')) {
          cssSize += resource.transferSize;
        }
      }
    });

    return {
      totalSize: Math.round(totalSize / 1024), // KB
      jsSize: Math.round(jsSize / 1024), // KB
      cssSize: Math.round(cssSize / 1024), // KB
    };
  }, []);

  return { getBundleSize };
}