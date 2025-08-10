/**
 * React hooks for performance monitoring and optimization
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  initPerformanceMonitoring,
  measureComponentRender,
  measureApiCall,
  getPerformanceMetrics,
  logPerformanceMetrics,
  PerformanceMetrics,
  PERFORMANCE_CONFIG
} from '../../lib/performanceMonitoring';

/**
 * Hook to initialize performance monitoring
 */
export function useInitPerformanceMonitoring(): void {
  useEffect(() => {
    initPerformanceMonitoring();
  }, []);
}

/**
 * Hook to measure component render time
 * @param componentName - Name of the component
 */
export function useComponentRenderTime(componentName: string): void {
  const renderCount = useRef(0);
  
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      renderCount.current += 1;
      
      // Only log if render took longer than threshold
      if (duration > 50) {
        console.debug(
          `Component ${componentName} render #${renderCount.current} took ${duration.toFixed(2)}ms`
        );
      }
    };
  });
}

/**
 * Hook to measure API call time
 * @returns Function to wrap API calls for performance measurement
 */
export function useApiCallMonitoring() {
  return useCallback(<T>(apiName: string, apiCall: () => Promise<T>): Promise<T> => {
    return measureApiCall(apiName, apiCall);
  }, []);
}

/**
 * Hook to track component re-renders
 * @param componentName - Name of the component
 * @param props - Component props to track
 */
export function useRenderTracker(componentName: string, props: Record<string, any>): void {
  const renderCount = useRef(0);
  const prevProps = useRef<Record<string, any>>({});
  
  useEffect(() => {
    renderCount.current += 1;
    
    // Skip first render
    if (renderCount.current === 1) {
      prevProps.current = { ...props };
      return;
    }
    
    // Find which props changed
    const changedProps: Record<string, { previous: any; current: any }> = {};
    
    Object.entries(props).forEach(([key, value]) => {
      if (prevProps.current[key] !== value) {
        changedProps[key] = {
          previous: prevProps.current[key],
          current: value
        };
      }
    });
    
    // Log re-renders in development
    if (process.env.NODE_ENV === 'development' && Object.keys(changedProps).length > 0) {
      console.debug(
        `Component ${componentName} re-rendered (${renderCount.current}) due to props change:`,
        changedProps
      );
    }
    
    prevProps.current = { ...props };
  });
}

/**
 * Hook to track state updates
 * @param initialState - Initial state value
 * @param stateName - Name of the state for tracking
 * @returns State value and setter function
 */
export function useTrackedState<T>(
  initialState: T | (() => T),
  stateName: string
): [T, (newValue: T | ((prevState: T) => T)) => void] {
  const [state, setState] = useState<T>(initialState);
  const updateCount = useRef(0);
  
  const setTrackedState = useCallback((newValue: T | ((prevState: T) => T)) => {
    updateCount.current += 1;
    
    setState((prevState) => {
      const nextState = typeof newValue === 'function'
        ? (newValue as ((prevState: T) => T))(prevState)
        : newValue;
      
      // Log state updates in development
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          `State "${stateName}" updated (#${updateCount.current}):`,
          { previous: prevState, current: nextState }
        );
      }
      
      return nextState;
    });
  }, [stateName]);
  
  return [state, setTrackedState];
}

/**
 * Hook to measure time between events
 * @returns Object with start, end, and reset functions
 */
export function useTimeMeasurement() {
  const startTimeRef = useRef<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);
  
  const start = useCallback(() => {
    startTimeRef.current = performance.now();
    setElapsedTime(null);
  }, []);
  
  const end = useCallback(() => {
    if (startTimeRef.current === null) {
      console.warn('Timer was not started');
      return null;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;
    setElapsedTime(duration);
    return duration;
  }, []);
  
  const reset = useCallback(() => {
    startTimeRef.current = null;
    setElapsedTime(null);
  }, []);
  
  return { start, end, reset, elapsedTime };
}

/**
 * Hook to get current performance metrics
 * @returns Current performance metrics
 */
export function usePerformanceMetrics(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  
  useEffect(() => {
    // Update metrics initially
    setMetrics(getPerformanceMetrics());
    
    // Update metrics periodically
    const intervalId = setInterval(() => {
      setMetrics(getPerformanceMetrics());
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return metrics;
}

/**
 * Hook to detect slow renders
 * @param threshold - Threshold in milliseconds to consider a render slow
 * @returns Function to wrap render content
 */
export function useSlowRenderDetection(threshold = 16) {
  return useCallback(<T>(renderFunction: () => T, componentName?: string): T => {
    return measureComponentRender(componentName || 'Component', renderFunction);
  }, [threshold]);
}

/**
 * Hook to detect long tasks
 */
export function useLongTaskDetection(): void {
  useEffect(() => {
    // Skip if PerformanceObserver is not available
    if (typeof PerformanceObserver === 'undefined') {
      return;
    }
    
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      
      entries.forEach((entry) => {
        console.warn(
          `Long task detected: ${entry.duration.toFixed(2)}ms`,
          entry
        );
      });
    });
    
    try {
      observer.observe({ type: 'longtask', buffered: true });
    } catch (e) {
      console.warn('LongTask monitoring not supported', e);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
}

/**
 * Hook to detect memory leaks
 * @param componentName - Name of the component
 */
export function useMemoryLeakDetection(componentName: string): void {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  useEffect(() => {
    const startHeapSize = (window as any).performance?.memory?.usedJSHeapSize;
    
    return () => {
      // Check heap size on unmount
      setTimeout(() => {
        const endHeapSize = (window as any).performance?.memory?.usedJSHeapSize;
        
        if (startHeapSize && endHeapSize && endHeapSize - startHeapSize > 1000000) {
          console.warn(
            `Possible memory leak detected in ${componentName}: ` +
            `Heap increased by ${((endHeapSize - startHeapSize) / 1000000).toFixed(2)} MB`
          );
        }
      }, 100);
    };
  }, [componentName]);
}