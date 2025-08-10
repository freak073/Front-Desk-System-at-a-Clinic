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
  <div className="bg-surface-800 rounded-lg shadow-md overflow-hidden border border-gray-700 hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-gray-100">{doctor.name}</h3>
            <p className="text-gray-300 mt-1">{doctor.specialization}</p>
            <p className="text-gray-400 text-sm mt-2">{doctor.location}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(doctor.status)}`}>
            {getStatusText(doctor.status)}
          </span>
        </div>

  <div className="mt-4 flex items-center text-sm text-gray-400" aria-live="polite">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Next available: {nextAvailable ? new Date(nextAvailable).toLocaleString([], { hour:'2-digit', minute:'2-digit', month:'short', day:'numeric'}) : 'Loading...'}</span>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => onViewSchedule(doctor.id)}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md bg-accent-600 text-white hover:bg-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            View Schedule
          </button>
          <button
            onClick={() => onEdit(doctor.id)}
            className="px-3 py-2 text-gray-400 hover:text-gray-200 focus:outline-none"
            aria-label="Edit doctor"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button
            onClick={() => onDelete(doctor.id)}
            className="px-3 py-2 text-gray-400 hover:text-red-400 focus:outline-none"
            aria-label="Delete doctor"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;