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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 text-gray-100 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Dynamic gradient mesh */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/20 via-transparent to-violet-900/20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-2/3 right-1/3 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-indigo-500/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
        
        {/* Enhanced floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-purple-400/30 rounded-full animate-float"
              style={{
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 4}s`
              }}
            ></div>
          ))}
        </div>

        {/* Diagonal light streaks */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-bl from-purple-400/10 via-transparent to-transparent transform rotate-12 translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-tr from-violet-400/10 via-transparent to-transparent transform -rotate-12 -translate-x-1/4 translate-y-1/4"></div>
      </div>

      <div className="relative z-10">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header Section */}
          <div className="mb-10">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/25">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-violet-200 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                {user && (
                  <p className="text-xl text-gray-300 mt-2">
                    Welcome back, <span className="text-purple-300 font-semibold">{user.username}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"></div>
          </div>

          <NavigationTabs />
          
          <div className="space-y-8">
            <DashboardOverview stats={stats} isLoading={isLoading} />
            
            {/* Enhanced Activity & Status Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Recent Activity - Enhanced */}
              <div className="xl:col-span-2 backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-500">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Recent Activity</h3>
                      <p className="text-purple-300 text-sm">Live updates from your clinic</p>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { icon: '👤', color: 'bg-green-500', text: 'Patient John Doe added to queue', time: '2 min ago', type: 'success' },
                    { icon: '📅', color: 'bg-blue-500', text: 'Appointment scheduled with Dr. Smith', time: '5 min ago', type: 'info' },
                    { icon: '🔄', color: 'bg-yellow-500', text: 'Queue status updated for Patient #3', time: '8 min ago', type: 'warning' },
                    { icon: '✅', color: 'bg-purple-500', text: 'Dr. Johnson completed consultation', time: '12 min ago', type: 'success' },
                    { icon: '📋', color: 'bg-indigo-500', text: 'New patient registration completed', time: '15 min ago', type: 'info' }
                  ].map((activity, index) => (
                    <div key={index} className="group flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
                      <div className={`w-10 h-10 ${activity.color} rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-200 font-medium group-hover:text-white transition-colors">{activity.text}</p>
                        <p className="text-gray-400 text-sm mt-1">{activity.time}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* System Status - Enhanced */}
              <div className="backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-500">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">System Health</h3>
                    <p className="text-green-300 text-sm">All systems operational</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {[
                    { label: 'Database', status: 'Online', color: 'green', icon: '🗄️', uptime: '99.9%' },
                    { label: 'API Services', status: 'Healthy', color: 'green', icon: '🔗', uptime: '99.8%' },
                    { label: 'Real-time Sync', status: 'Active', color: 'blue', icon: '🔄', uptime: '99.7%' },
                    { label: 'Last Backup', status: '2 hours ago', color: 'purple', icon: '💾', uptime: 'Daily' }
                  ].map((item, index) => (
                    <div key={index} className="group p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-gray-200 font-medium group-hover:text-white transition-colors">{item.label}</span>
                        </div>
                        <div className={`w-3 h-3 rounded-full animate-pulse ${
                          item.color === 'green' ? 'bg-green-400' : 
                          item.color === 'blue' ? 'bg-blue-400' : 'bg-purple-400'
                        }`}></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          item.color === 'green' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                          item.color === 'blue' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-gray-400 text-xs">{item.uptime}</span>
                      </div>
                    </div>
                  ))}
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
