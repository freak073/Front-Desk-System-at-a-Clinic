'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import NavigationTabs from '../components/NavigationTabs';
import Header from '../components/Header';
import { useDashboardStatsUpdates } from '../hooks/useRealTimeUpdates';
import { DashboardStats } from './dashboard.service';
import { memoizeWithExpiration } from '../../lib/memoization';

// Memoized placeholder heavy calc
const calculateAverageWaitTime = memoizeWithExpiration((stats: DashboardStats) => stats.averageWaitTime, 60000);

const DashboardPage = () => {
  const { user } = useAuth();
  const { data: statsData } = useDashboardStatsUpdates();
  const stats = statsData?.data ?? {
    queueCount: 0,
    todayAppointments: 0,
    availableDoctors: 0,
    averageWaitTime: 0
  };

  return (
  <div className="min-h-screen bg-surface-900 text-gray-100">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-100">Front Desk Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.username}. Here's what's happening today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-surface-800 overflow-hidden shadow rounded-lg border border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-accent-600/20 rounded-md p-3">
                  <svg className="h-6 w-6 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-400 truncate">Patients in Queue</dt>
                  <dd className="text-2xl font-semibold text-gray-100">{stats.queueCount}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-800 overflow-hidden shadow rounded-lg border border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-600/20 rounded-md p-3">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-400 truncate">Today's Appointments</dt>
                  <dd className="text-2xl font-semibold text-gray-100">{stats.todayAppointments}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-800 overflow-hidden shadow rounded-lg border border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-600/20 rounded-md p-3">
                  <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-400 truncate">Available Doctors</dt>
                  <dd className="text-2xl font-semibold text-gray-100">{stats.availableDoctors}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-800 overflow-hidden shadow rounded-lg border border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-600/20 rounded-md p-3">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-400 truncate">Avg. Wait Time</dt>
                  <dd className="text-2xl font-semibold text-gray-100">{calculateAverageWaitTime(stats)} min</dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        <NavigationTabs />
        <div className="mt-6 bg-surface-900 border border-gray-700 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-100 mb-4">Dashboard Overview</h2>
            <p className="text-gray-400 mb-4">Use the navigation tabs above to manage Queue, Appointments, Doctors, and Patients. This overview will be enhanced with real-time activity.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-700 rounded-lg p-4 bg-surface-800">
                <h3 className="text-md font-medium text-gray-100 mb-2">Recent Activity (placeholder)</h3>
                <p className="text-sm text-gray-500">Activity feed not implemented yet.</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-4 bg-surface-800">
                <h3 className="text-md font-medium text-gray-100 mb-2">Quick Tips</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">
                  <li>Queue tab: update statuses & priorities.</li>
                  <li>Appointments: schedule, filter, cancel.</li>
                  <li>Doctors: manage availability.</li>
                </ul>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
