'use client';

import React from 'react';

interface TouchFriendlyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

const TouchFriendlyButton: React.FC<TouchFriendlyButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  'aria-label': ariaLabel,
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-surface-900 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Ensure minimum touch target size of 44px
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-w-[44px] min-h-[44px]',
    md: 'px-4 py-2 text-sm min-w-[44px] min-h-[44px] md:px-6 md:py-3',
    lg: 'px-6 py-3 text-base min-w-[44px] min-h-[44px] md:px-8 md:py-4'
  };

  const variantClasses = {
    primary: 'bg-accent-600 hover:bg-accent-500 text-white shadow desktop:hover:shadow-lg desktop:hover:scale-105',
    secondary: 'bg-surface-700 hover:bg-surface-600 text-gray-200 shadow desktop:hover:shadow-md desktop:hover:scale-105',
    danger: 'bg-danger-600 hover:bg-danger-500 text-white shadow desktop:hover:shadow-lg desktop:hover:scale-105',
    ghost: 'bg-transparent hover:bg-surface-700 text-gray-300 desktop:hover:shadow-sm'
  };

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      aria-label={ariaLabel}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default TouchFriendlyButton;