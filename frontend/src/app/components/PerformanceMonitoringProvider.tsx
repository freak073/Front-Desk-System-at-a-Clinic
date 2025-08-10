/**
 * Performance Monitoring Provider Component
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  initPerformanceMonitoring,
  getPerformanceMetrics,
  logPerformanceMetrics,
  resetPerformanceMetrics,
  PerformanceMetrics,
  PERFORMANCE_CONFIG
} from '../../lib/performanceMonitoring';
import { useLongTaskDetection } from '../hooks/usePerformanceMonitoring';

/**
 * Performance context interface
 */
interface PerformanceContextType {
  // Current performance metrics
  metrics: PerformanceMetrics;
  // Whether performance monitoring is enabled
  isEnabled: boolean;
  // Toggle performance monitoring
  toggleMonitoring: () => void;
  // Log current metrics to console
  logMetrics: () => void;
  // Reset all metrics
  resetMetrics: () => void;
}

// Create context with default values
const PerformanceContext = createContext<PerformanceContextType>({
  metrics: {},
  isEnabled: false,
  toggleMonitoring: () => {},
  logMetrics: () => {},
  resetMetrics: () => {}
});

/**
 * Hook to use performance monitoring context
 * @returns Performance monitoring context
 */
export const usePerformanceMonitoring = () => useContext(PerformanceContext);

/**
 * Props for PerformanceMonitoringProvider
 */
interface PerformanceMonitoringProviderProps {
  children: ReactNode;
  // Whether to enable performance monitoring by default
  defaultEnabled?: boolean;
  // Whether to automatically log metrics on page load
  autoLogOnLoad?: boolean;
  // Whether to detect long tasks
  detectLongTasks?: boolean;
}

/**
 * Provider component for performance monitoring
 */
export const PerformanceMonitoringProvider: React.FC<PerformanceMonitoringProviderProps> = ({
  children,
  defaultEnabled = process.env.NODE_ENV === 'development',
  autoLogOnLoad = false,
  detectLongTasks = true
}) => {
  // State for metrics and enabled status
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isEnabled, setIsEnabled] = useState(defaultEnabled);

  // Initialize performance monitoring
  useEffect(() => {
    if (isEnabled) {
      initPerformanceMonitoring();
      
      // Set up interval to update metrics
      const intervalId = setInterval(() => {
        setMetrics(getPerformanceMetrics());
      }, 5000);
      
      // Auto-log metrics on page load if enabled
      if (autoLogOnLoad) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            logPerformanceMetrics();
          }, 3000);
        });
      }
      
      return () => clearInterval(intervalId);
    }
  }, [isEnabled, autoLogOnLoad]);

  // Detect long tasks if enabled
  if (detectLongTasks && isEnabled) {
    useLongTaskDetection();
  }

  // Toggle performance monitoring
  const toggleMonitoring = () => {
    setIsEnabled(prev => !prev);
    if (!isEnabled) {
      // Reset metrics when enabling
      resetPerformanceMetrics();
    }
  };

  // Log current metrics
  const logMetrics = () => {
    logPerformanceMetrics();
  };

  // Reset all metrics
  const resetMetrics = () => {
    resetPerformanceMetrics();
    setMetrics({});
  };

  // Context value
  const contextValue: PerformanceContextType = {
    metrics,
    isEnabled,
    toggleMonitoring,
    logMetrics,
    resetMetrics
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
};

/**
 * Example usage:
 * 
 * // In your app's provider component:
 * <PerformanceMonitoringProvider>
 *   <App />
 * </PerformanceMonitoringProvider>
 * 
 * // In any component:
 * const { metrics, isEnabled, toggleMonitoring, logMetrics } = usePerformanceMonitoring();
 */