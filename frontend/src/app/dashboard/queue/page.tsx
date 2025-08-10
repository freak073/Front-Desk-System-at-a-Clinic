'use client';

import React from 'react';
import { useAuth } from '../../../context/AuthContext';

const QueuePage = () => {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Queue Management</h1>
        <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
          + Add to Queue
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">Queue management interface coming in Task 11...</p>
      </div>
    </div>
  );
};

export default QueuePage;
