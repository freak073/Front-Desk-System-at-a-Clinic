'use client';

import React from 'react';

// Generic loading spinner component
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-accent-500 ${sizeClasses[size]} ${className}`} />
  );
};

// Skeleton loader for list items
export const SkeletonListItem: React.FC<{
  lines?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({ lines = 2, showAvatar = false, className = '' }) => {
  return (
    <div className={`animate-pulse bg-surface-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`h-4 bg-gray-600 rounded ${
                i === lines - 1 ? 'w-3/4' : 'w-full'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Skeleton loader for cards
export const SkeletonCard: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-surface-800 border border-gray-700 rounded-lg p-6 ${className}`}>
      <div className="space-y-4">
        <div className="h-6 bg-gray-600 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-600 rounded w-full" />
          <div className="h-4 bg-gray-600 rounded w-5/6" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-600 rounded w-20" />
          <div className="h-8 bg-gray-600 rounded w-24" />
        </div>
      </div>
    </div>
  );
};

// Skeleton loader for table rows
export const SkeletonTableRow: React.FC<{
  columns?: number;
  className?: string;
}> = ({ columns = 4, className = '' }) => {
  return (
    <div className={`animate-pulse bg-surface-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {Array.from({ length: columns - 1 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-600 rounded flex-1" />
          ))}
        </div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-600 rounded w-20" />
          <div className="h-8 bg-gray-600 rounded w-8" />
        </div>
      </div>
    </div>
  );
};

// Loading overlay for forms and modals
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
  className?: string;
}> = ({ isVisible, message = 'Loading...', className = '' }) => {
  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg ${className}`}>
      <div className="bg-surface-800 rounded-lg p-6 flex items-center space-x-3 border border-gray-700">
        <LoadingSpinner size="md" />
        <span className="text-gray-200 font-medium">{message}</span>
      </div>
    </div>
  );
};

// Button with loading state
export const LoadingButton: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  loadingText?: string;
}> = ({ 
  isLoading, 
  children, 
  onClick, 
  disabled = false, 
  className = '', 
  type = 'button',
  loadingText 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`relative flex items-center justify-center space-x-2 ${className} ${
        (disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </button>
  );
};

// Page loading component
export const PageLoading: React.FC<{
  message?: string;
  showSkeleton?: boolean;
  skeletonType?: 'list' | 'cards' | 'table';
  skeletonCount?: number;
}> = ({ 
  message = 'Loading...', 
  showSkeleton = true, 
  skeletonType = 'list',
  skeletonCount = 6 
}) => {
  if (!showSkeleton) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-400">{message}</p>
        </div>
      </div>
    );
  }

  const SkeletonComponent = {
    list: SkeletonListItem,
    cards: SkeletonCard,
    table: SkeletonTableRow
  }[skeletonType];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="space-y-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonComponent key={i} />
        ))}
      </div>
    </div>
  );
};

// Error state component
export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({ 
  title = 'Something went wrong',
  message = 'An error occurred while loading data',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
      <div className="text-red-600 mb-2">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-red-800 mb-2">{title}</h3>
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

// Empty state component
export const EmptyState: React.FC<{
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}> = ({ 
  title = 'No data found',
  message = 'There are no items to display',
  actionLabel,
  onAction,
  icon,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-gray-400 mb-4">
        {icon || (
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-300 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-accent-600 text-white rounded-md hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};