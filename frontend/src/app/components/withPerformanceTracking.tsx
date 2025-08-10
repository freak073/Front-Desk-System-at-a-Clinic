/**
 * Higher-Order Component (HOC) for performance tracking
 */

'use client';

import React, { ComponentType, useEffect, useRef } from 'react';
import { measureComponentRender } from '../../lib/performanceMonitoring';
import { useComponentRenderTime, useRenderTracker, useMemoryLeakDetection } from '../hooks/usePerformanceMonitoring';

/**
 * Options for the withPerformanceTracking HOC
 */
export interface PerformanceTrackingOptions {
  // Track component render time
  trackRenderTime?: boolean;
  // Track component re-renders and their causes
  trackReRenders?: boolean;
  // Track potential memory leaks
  trackMemoryLeaks?: boolean;
  // Custom component name (defaults to displayName or function name)
  componentName?: string;
  // Log to console when component mounts/unmounts
  logLifecycle?: boolean;
}

/**
 * Higher-Order Component that adds performance tracking to a React component
 * 
 * @param WrappedComponent - The component to wrap with performance tracking
 * @param options - Configuration options for performance tracking
 * @returns A new component with performance tracking
 */
export function withPerformanceTracking<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: PerformanceTrackingOptions = {}
): ComponentType<P> {
  const {
    trackRenderTime = true,
    trackReRenders = true,
    trackMemoryLeaks = process.env.NODE_ENV === 'development',
    logLifecycle = process.env.NODE_ENV === 'development',
    componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component'
  } = options;

  // Set display name for debugging
  const wrappedComponentName = `WithPerformanceTracking(${componentName})`;

  // Create the wrapped component
  const WrappedWithPerformance = (props: P) => {
    // Track render count
    const renderCount = useRef(0);

    // Use performance tracking hooks based on options
    if (trackRenderTime) {
      useComponentRenderTime(componentName);
    }

    if (trackReRenders) {
      useRenderTracker(componentName, props as Record<string, any>);
    }

    if (trackMemoryLeaks) {
      useMemoryLeakDetection(componentName);
    }

    // Log component lifecycle
    useEffect(() => {
      renderCount.current += 1;
      
      if (logLifecycle) {
        console.debug(`${componentName} mounted (render #${renderCount.current})`);
      }

      return () => {
        if (logLifecycle) {
          console.debug(`${componentName} unmounted after ${renderCount.current} renders`);
        }
      };
    }, []);

    // Render the wrapped component with performance measurement
    return measureComponentRender(componentName, () => {
      return <WrappedComponent {...props} />;
    });
  };

  // Set display name for dev tools
  WrappedWithPerformance.displayName = wrappedComponentName;

  return WrappedWithPerformance;
}

/**
 * Example usage:
 * 
 * // Basic usage
 * const MyComponentWithTracking = withPerformanceTracking(MyComponent);
 * 
 * // With custom options
 * const MyComponentWithCustomTracking = withPerformanceTracking(MyComponent, {
 *   componentName: 'CustomNamedComponent',
 *   trackRenderTime: true,
 *   trackReRenders: true,
 *   trackMemoryLeaks: true,
 *   logLifecycle: true
 * });
 */