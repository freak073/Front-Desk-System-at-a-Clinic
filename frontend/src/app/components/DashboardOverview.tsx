'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardStats } from '../dashboard/dashboard.service';

interface DashboardOverviewProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, isLoading = false }) => {
  const router = useRouter();

  const handleQuickAction = (action: string) => {
    // Add a small delay to provide visual feedback
    setTimeout(() => {
      switch (action) {
        case 'add-to-queue':
          router.push('/dashboard/queue');
          break;
        case 'schedule-appointment':
          router.push('/dashboard/appointments');
          break;
        case 'manage-doctors':
          router.push('/dashboard/doctors');
          break;
        default:
          break;
      }
    }, 100);
  };
  const statCards = [
    {
      title: 'Patients in Queue',
      value: stats.queueCount,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    {
      title: 'Available Doctors',
      value: stats.availableDoctors,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      title: 'Avg. Wait Time',
      value: `${stats.averageWaitTime} min`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[...Array(4)].map((_, index) => {
            const gradients = [
              'from-blue-500/50 to-cyan-500/50',
              'from-green-500/50 to-emerald-500/50', 
              'from-purple-500/50 to-violet-500/50',
              'from-yellow-500/50 to-orange-500/50'
            ];
            
            return (
              <div key={index} className="backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 animate-pulse">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="h-4 bg-white/20 rounded-lg w-24 mb-3"></div>
                    <div className="h-10 bg-white/20 rounded-lg w-16 mb-2"></div>
                  </div>
                  <div className={`w-16 h-16 bg-gradient-to-br ${gradients[index]} rounded-2xl`}></div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className={`bg-gradient-to-r ${gradients[index]} h-2 rounded-full w-3/4`}></div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-10 animate-pulse">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500/50 to-violet-600/50 rounded-2xl"></div>
            <div>
              <div className="h-8 bg-white/20 rounded-lg w-32 mb-2"></div>
              <div className="h-4 bg-white/20 rounded-lg w-24"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/10 rounded-2xl p-6 flex flex-col items-center space-y-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl"></div>
                <div className="text-center space-y-2">
                  <div className="h-5 bg-white/20 rounded w-20"></div>
                  <div className="h-4 bg-white/20 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((card, index) => {
          const getCardAction = (title: string) => {
            if (title.includes('Queue')) return 'add-to-queue';
            if (title.includes('Appointments')) return 'schedule-appointment';
            if (title.includes('Doctors')) return 'manage-doctors';
            return null;
          };

          const cardAction = getCardAction(card.title);
          const isClickable = cardAction !== null;

          // Enhanced color schemes for each card
          const cardStyles = {
            0: { gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/25', hover: 'hover:shadow-blue-500/40' },
            1: { gradient: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/25', hover: 'hover:shadow-green-500/40' },
            2: { gradient: 'from-purple-500 to-violet-500', shadow: 'shadow-purple-500/25', hover: 'hover:shadow-purple-500/40' },
            3: { gradient: 'from-yellow-500 to-orange-500', shadow: 'shadow-yellow-500/25', hover: 'hover:shadow-yellow-500/40' }
          };

          const style = cardStyles[index as keyof typeof cardStyles];

          return (
            <div
              key={index}
              onClick={isClickable ? () => handleQuickAction(cardAction) : undefined}
              className={`group backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl ${style.shadow} ${style.hover} transition-all duration-500 hover:scale-105 hover:bg-white/15 hover:border-white/30 ${isClickable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 active:scale-100' : ''
                }`}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={isClickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleQuickAction(cardAction);
                }
              } : undefined}
              aria-label={isClickable ? `Navigate to ${card.title}` : undefined}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-300 mb-3 group-hover:text-gray-200 transition-colors">{card.title}</p>
                  <p className="text-4xl font-bold text-white mb-2 group-hover:scale-105 transition-transform">{card.value}</p>
                  {isClickable && (
                    <p className="text-xs text-purple-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to manage →
                    </p>
                  )}
                </div>
                <div className={`w-16 h-16 bg-gradient-to-br ${style.gradient} rounded-2xl flex items-center justify-center shadow-xl ${style.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <div className="text-white">
                    {card.icon}
                  </div>
                </div>
              </div>
              
              {/* Progress bar for visual appeal */}
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div 
                  className={`bg-gradient-to-r ${style.gradient} h-2 rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min((typeof card.value === 'string' ? parseInt(card.value) : card.value) * 10, 100)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Quick Actions */}
      <div className="backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-10 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-500">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/25">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white">Quick Actions</h3>
              <p className="text-purple-300">Streamline your workflow</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Ready</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => handleQuickAction('add-to-queue')}
            className="group bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold p-6 rounded-2xl flex flex-col items-center space-y-4 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 active:scale-100"
            aria-label="Add Patient to Queue"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="text-center">
              <h4 className="font-bold text-lg">Add to Queue</h4>
              <p className="text-purple-200 text-sm opacity-90">Register new patient</p>
            </div>
          </button>
          
          <button
            onClick={() => handleQuickAction('schedule-appointment')}
            className="group backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 text-white font-bold p-6 rounded-2xl flex flex-col items-center space-y-4 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-100"
            aria-label="Schedule Appointment"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <h4 className="font-bold text-lg">Schedule</h4>
              <p className="text-gray-300 text-sm opacity-90">Book appointment</p>
            </div>
          </button>
          
          <button
            onClick={() => handleQuickAction('manage-doctors')}
            className="group backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 text-white font-bold p-6 rounded-2xl flex flex-col items-center space-y-4 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 focus:outline-none focus:ring-2 focus:ring-green-500/50 active:scale-100"
            aria-label="Manage Doctors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="text-center">
              <h4 className="font-bold text-lg">Manage Doctors</h4>
              <p className="text-gray-300 text-sm opacity-90">Staff management</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;