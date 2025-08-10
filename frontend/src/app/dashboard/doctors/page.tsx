'use client';

import React from 'react';
import { useAuth } from '../../../context/AuthContext';

const DoctorsPage = () => {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Doctor Management</h1>
        <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition">
          + Add Doctor
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">Doctor management interface coming in Task 13...</p>
      </div>
    </div>
  );
};

export default DoctorsPage;
