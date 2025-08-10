'use client';

import { QueryClient, QueryClientProvider } from 'react-query';
import { useState } from 'react';
import { CACHE_CONFIG } from '../lib/cacheUtils';
import { PerformanceMonitoringProvider } from './components/PerformanceMonitoringProvider';
import { ToastProvider } from './components/ToastProvider';
import dynamic from 'next/dynamic';
const PerformanceDashboard = dynamic(() => import('./components/PerformanceDashboard').then(m => m.PerformanceDashboard), {
  ssr: false,
  loading: () => null,
});

export default function Providers({ children }: { readonly children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Global defaults for all queries
        staleTime: CACHE_CONFIG.DEFAULT_STALE_TIME,
        cacheTime: CACHE_CONFIG.DEFAULT_CACHE_TIME,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 2,
        // Enable suspense mode for React.lazy compatibility
        suspense: false, // Set to true when all components are ready for suspense
      },
      mutations: {
        // Retry failed mutations twice
        retry: 2,
      },
    },
  }));

  return (
    <PerformanceMonitoringProvider 
      defaultEnabled={process.env.NODE_ENV === 'development'}
      autoLogOnLoad={false}
      detectLongTasks={true}
    >
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
          {/* Performance Dashboard (only visible in development by default) */}
          {process.env.NODE_ENV === 'development' && <PerformanceDashboard />}
        </ToastProvider>
      </QueryClientProvider>
    </PerformanceMonitoringProvider>
  );
}