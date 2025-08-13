import { useEffect, useCallback } from 'react';

// Preload components based on user interaction patterns
export function useComponentPreloader() {
  const preloadComponent = useCallback((componentImport: () => Promise<any>) => {
    // Preload on idle time
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        componentImport().catch(() => {
          // Silently fail - component will load when needed
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        componentImport().catch(() => {
          // Silently fail - component will load when needed
        });
      }, 100);
    }
  }, []);

  const preloadOnHover = useCallback((componentImport: () => Promise<any>) => {
    return {
      onMouseEnter: () => preloadComponent(componentImport),
      onFocus: () => preloadComponent(componentImport),
    };
  }, [preloadComponent]);

  // Preload critical components after initial render
  useEffect(() => {
    const preloadCriticalComponents = () => {
      // Preload appointment form (commonly used)
      preloadComponent(() => import('../components/AppointmentForm'));
      
      // Preload calendar view (heavy component)
      preloadComponent(() => import('../dashboard/components/MonthlyCalendar'));
    };

    // Preload after a short delay to not block initial render
    const timer = setTimeout(preloadCriticalComponents, 2000);
    return () => clearTimeout(timer);
  }, [preloadComponent]);

  return {
    preloadComponent,
    preloadOnHover,
  };
}