'use client';

import React from 'react';
import { useAuth } from '../../../context/AuthContext';

const AppointmentsPage = () => {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Appointments Management</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
          + New Appointment
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">Appointment management interface coming in Task 12...</p>
      </div>
    </div>
  );
};

export default AppointmentsPage;
