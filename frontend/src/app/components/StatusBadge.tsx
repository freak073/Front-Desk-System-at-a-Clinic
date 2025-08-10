'use client';

import React from 'react';

interface StatusBadgeProps {
  status: 'booked' | 'completed' | 'canceled' | 'waiting' | 'with_doctor';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  // Status badge colors and text
  const getStatusInfo = (status: string) => {
    // Dark theme friendly variants: subtle background tint + clear text color
    switch (status) {
      case 'booked':
        return { color: 'bg-blue-500/20 text-blue-300 border border-blue-500/40', text: 'Booked' };
      case 'completed':
        return { color: 'bg-green-500/20 text-green-300 border border-green-500/40', text: 'Completed' };
      case 'canceled':
        return { color: 'bg-red-500/20 text-red-300 border border-red-500/40', text: 'Canceled' };
      case 'waiting':
        return { color: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40', text: 'Waiting' };
      case 'with_doctor':
        return { color: 'bg-purple-500/20 text-purple-300 border border-purple-500/40', text: 'With Doctor' };
      default:
        return { color: 'bg-surface-600 text-gray-200 border border-surface-500', text: status };
    }
  };

  const { color, text } = getStatusInfo(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${color} ${className}`}>{text}</span>
  );
};

export default StatusBadge;