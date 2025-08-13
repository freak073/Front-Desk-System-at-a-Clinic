'use client';

import React from 'react';
import { useAuth } from '../../../context/AuthContext';

const QueueManagementPage = () => {
  const { user } = useAuth();

  // Sample queue data
  const queueEntries = [
    {
      id: 1,
      patientName: 'John Smith',
      queueNumber: 1,
      status: 'waiting',
      priority: 'normal',
      arrivalTime: '9:30 AM',
      estimatedWaitTime: '15 min'
    },
    {
      id: 2,
      patientName: 'Sarah Johnson',
      queueNumber: 2,
      status: 'with_doctor',
      priority: 'urgent',
      arrivalTime: '9:45 AM',
      estimatedWaitTime: '5 min'
    },
    {
      id: 3,
      patientName: 'Mike Wilson',
      queueNumber: 3,
      status: 'waiting',
      priority: 'normal',
      arrivalTime: '10:00 AM',
      estimatedWaitTime: '25 min'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-600 text-white';
      case 'with_doctor':
        return 'bg-blue-600 text-white';
      case 'completed':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Waiting';
      case 'with_doctor':
        return 'With Doctor';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Front Desk Dashboard</h1>
        </div>

        <div className="mb-6">
          <nav className="flex space-x-2" role="tablist">
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 text-white">
              Queue Management
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-300 hover:bg-gray-800">
              Appointment Management
            </button>
          </nav>
        </div>
        
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Queue Management</h2>
            
            <div className="space-y-4">
              {queueEntries.map((entry) => (
                <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-accent-600 rounded-full flex items-center justify-center text-white font-bold">
                        {entry.queueNumber}
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-lg">{entry.patientName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>Arrived: {entry.arrivalTime}</span>
                          <span>Est. Wait: {entry.estimatedWaitTime}</span>
                          {entry.priority === 'urgent' && (
                            <span className="text-red-400 font-medium">🚨 Urgent</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(entry.status)}`}>
                        {getStatusLabel(entry.status)}
                      </span>
                      <button className="p-1 text-gray-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <button className="w-full bg-white text-black py-4 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Add Patient to Queue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueManagementPage;