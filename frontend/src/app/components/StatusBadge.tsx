'use client';

import React from 'react';

interface StatusBadgeProps {
  status: 'booked' | 'completed' | 'canceled' | 'waiting' | 'with_doctor';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  // Status badge colors and text
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'booked':
        return { color: 'bg-blue-100 text-blue-800', text: 'Booked' };
      case 'completed':
        return { color: 'bg-green-100 text-green-800', text: 'Completed' };
      case 'canceled':
        return { color: 'bg-red-100 text-red-800', text: 'Canceled' };
      case 'waiting':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Waiting' };
      case 'with_doctor':
        return { color: 'bg-purple-100 text-purple-800', text: 'With Doctor' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: status };
    }
  };

  const { color, text } = getStatusInfo(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}>
      {text}
    </span>
  );
};

export default StatusBadge;