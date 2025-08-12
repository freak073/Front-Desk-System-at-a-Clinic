'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import NavigationTabs from '../components/NavigationTabs';
import Header from '../components/Header';
import DashboardOverview from '../components/DashboardOverview';
import { useDashboardStatsUpdates } from '../hooks/useRealTimeUpdates';
import { DashboardStats } from './dashboard.service';
import { memoizeWithExpiration } from '../../lib/memoization';

// Memoized placeholder heavy calc
const calculateAverageWaitTime = memoizeWithExpiration((stats: DashboardStats) => stats.averageWaitTime, 60000);

const DashboardPage = () => {
  const { user } = useAuth();
  const { data: statsData, isLoading } = useDashboardStatsUpdates();
  const stats = statsData?.data ?? {
    queueCount: 0,
    todayAppointments: 0,
    availableDoctors: 0,
    averageWaitTime: 0
  };

  return (
    <div className="min-h-screen bg-surface-900 text-gray-100">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white mb-2">Front Desk Dashboard</h1>
          {user && (
            <p className="text-gray-400">
              Welcome back, {user.username}. Here's what's happening today.
            </p>
          )}
        </div>

        <NavigationTabs />
        
        <div className="mt-6">
          <DashboardOverview stats={stats} isLoading={isLoading} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Patient John Doe added to queue</span>
                  <span className="text-gray-500 ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">Appointment scheduled with Dr. Smith</span>
                  <span className="text-gray-500 ml-auto">5 min ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-300">Queue status updated for Patient #3</span>
                  <span className="text-gray-500 ml-auto">8 min ago</span>
                </div>
              </div>
            </div>
            
            <div className="bg-surface-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Database Connection</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">API Status</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Last Backup</span>
                  <span className="text-gray-400 text-sm">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
