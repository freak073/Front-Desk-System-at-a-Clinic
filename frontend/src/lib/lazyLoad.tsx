'use client';

import React, { Suspense } from 'react';

// Loading component to show while the actual component is loading
const DefaultLoadingComponent = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

// Error component to show if loading fails
const DefaultErrorComponent = ({ error, reset }: { error: Error; reset: () => void }) => (
  <div className="p-8">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <h3 className="text-lg font-medium text-red-800">Error Loading Component</h3>
      <p className="mt-2 text-red-600">{error.message || 'Failed to load component'}</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  </div>
);

// Type for the lazy loading options
interface LazyLoadOptions {
  LoadingComponent?: React.ComponentType;
  ErrorComponent?: React.ComponentType<{ error: Error; reset: () => void }>;
}

/**
 * Creates a lazy-loaded component with Suspense and error handling
 * @param importFn - Dynamic import function for the component
 * @param options - Optional configuration for loading and error states
 * @returns Lazy-loaded component wrapped in Suspense
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const LazyComponent = React.lazy(importFn);
  const { 
    LoadingComponent = DefaultLoadingComponent,
    ErrorComponent = DefaultErrorComponent 
  } = options;

  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    const [error, setError] = React.useState<Error | null>(null);

    if (error) {
      return <ErrorComponent error={error} reset={() => setError(null)} />;
    }

    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}