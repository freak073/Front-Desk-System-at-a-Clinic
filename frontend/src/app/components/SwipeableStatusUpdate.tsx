'use client';

import React, { useState, useRef } from 'react';

interface SwipeableStatusUpdateProps {
  currentStatus: string;
  statuses: Array<{ value: string; label: string; color: string }>;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
  className?: string;
}

const SwipeableStatusUpdate: React.FC<SwipeableStatusUpdateProps> = ({
  currentStatus,
  statuses,
  onStatusChange,
  disabled = false,
  className = ''
}) => {
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const currentIndex = statuses.findIndex(s => s.value === currentStatus);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwipeMode(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isSwipeMode) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;
    
    // If vertical movement is greater than horizontal, cancel swipe
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      setIsSwipeMode(false);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled || !isSwipeMode) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    
    // Minimum swipe distance
    if (Math.abs(deltaX) > 50) {
      const direction = deltaX > 0 ? -1 : 1; // Swipe right = previous, swipe left = next
      const newIndex = currentIndex + direction;
      
      if (newIndex >= 0 && newIndex < statuses.length) {
        onStatusChange(statuses[newIndex].value);
      }
    }
    
    setIsSwipeMode(false);
  };

  const currentStatusData = statuses.find(s => s.value === currentStatus);

  return (
    <div className={`relative ${className}`}>
      {/* Mobile Swipe Interface */}
      <div className="md:hidden">
        <div
          className={`relative overflow-hidden rounded-lg border-2 transition-all duration-200 ${
            isSwipeMode ? 'border-accent-500 shadow-lg' : 'border-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={`px-4 py-3 text-center min-h-[44px] flex items-center justify-center ${currentStatusData?.color || 'bg-gray-600'}`}>
            <span className="text-sm font-medium text-white">
              {currentStatusData?.label || currentStatus}
            </span>
          </div>
          
          {/* Swipe Indicators */}
          <div className="absolute inset-y-0 left-2 flex items-center">
            {currentIndex > 0 && (
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </div>
          
          <div className="absolute inset-y-0 right-2 flex items-center">
            {currentIndex < statuses.length - 1 && (
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        </div>
        
        {/* Swipe Hint */}
        <div className="text-xs text-gray-500 text-center mt-1">
          Swipe to change status
        </div>
      </div>

      {/* Desktop Dropdown Interface */}
      <div className="hidden md:block">
        <select
          value={currentStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm border border-gray-600 rounded-md bg-surface-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed desktop:hover:border-gray-500 desktop:hover:shadow-sm transition-all duration-200"
        >
          {statuses.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SwipeableStatusUpdate;