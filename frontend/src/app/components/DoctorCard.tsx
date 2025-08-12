'use client';

import React, { useEffect, useState } from 'react';
import { Doctor } from '../../types';
import { fetchDoctorAvailability } from '../dashboard/appointments/appointments.service';

interface DoctorCardProps {
  doctor: Doctor;
  onEdit: (doctorId: number) => void;
  onDelete: (doctorId: number) => void;
  onViewSchedule: (doctorId: number) => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onEdit, onDelete, onViewSchedule }) => {
  const [nextAvailable, setNextAvailable] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (typeof fetchDoctorAvailability === 'function') {
      Promise.resolve(fetchDoctorAvailability(doctor.id))
        .then(res => { if (active) setNextAvailable(res?.nextAvailableTime || null); })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [doctor.id]);
  // Status badge colors
  const getStatusColor = (status: string) => {
    // Dark-friendly translucent badge styles with subtle border
    switch (status) {
      case 'available':
        return 'bg-green-600/20 text-green-300 border-green-700/40';
      case 'busy':
        return 'bg-yellow-600/20 text-yellow-300 border-yellow-700/40';
      case 'off_duty':
        return 'bg-red-600/20 text-red-300 border-red-700/40';
      default:
        return 'bg-gray-600/20 text-gray-300 border-gray-600/40';
    }
  };

  // Status display text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'Busy';
      case 'off_duty':
        return 'Off Duty';
      default:
        return status;
    }
  };

  return (
    <div className="bg-surface-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-600 to-accent-700 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-100 text-lg">{doctor.name}</h3>
            <p className="text-sm text-gray-400">{doctor.specialization}</p>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(doctor.status)}`}>
          {getStatusText(doctor.status)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-400">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{doctor.location}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-400">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Next available: {nextAvailable ? new Date(nextAvailable).toLocaleString([], { hour:'2-digit', minute:'2-digit'}) : 'Now'}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <button
          onClick={() => onViewSchedule(doctor.id)}
          className="px-3 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          View Schedule
        </button>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(doctor.id)}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-surface-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
            title="Edit Doctor"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            onClick={() => onDelete(doctor.id)}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-surface-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Delete Doctor"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;