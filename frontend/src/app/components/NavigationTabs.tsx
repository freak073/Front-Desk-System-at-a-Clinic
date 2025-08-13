'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { 
    name: 'Dashboard Home', 
    href: '/dashboard',
    shortName: 'Home',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    name: 'Queue Management', 
    href: '/dashboard/queue',
    shortName: 'Queue',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    name: 'Appointment Management', 
    href: '/dashboard/appointments',
    shortName: 'Appointments',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    name: 'Doctor Management', 
    href: '/dashboard/doctors',
    shortName: 'Doctors',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
];

interface NavigationTabsProps {
  className?: string;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({ className = '' }) => {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Force re-render to update active tab state
      setIsClient(false);
      setTimeout(() => setIsClient(true), 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  const getCurrentTab = () => {
    if (!isClient || !pathname) return null;
    
    // Handle exact dashboard home match first
    if (pathname === '/dashboard') {
      return '/dashboard';
    }
    
    // Then check other tabs (excluding dashboard home to avoid conflicts)
    for (const tab of tabs.slice(1)) {
      if (pathname === tab.href || pathname.startsWith(tab.href + '/')) {
        return tab.href;
      }
    }
    
    return null;
  };

  const currentTab = getCurrentTab();
  
  // Filter tabs based on current page - hide home button when on dashboard home
  const isOnDashboardHome = pathname === '/dashboard';
  const visibleTabs = isOnDashboardHome ? tabs.slice(1) : tabs; // Remove home tab when on dashboard home

  if (!isClient) {
    return (
      <div className={`mb-12 ${className}`}>
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-2">
          <nav className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {visibleTabs.map(tab => (
              <div
                key={tab.name}
                className="flex items-center space-x-3 px-6 py-4 rounded-xl animate-pulse whitespace-nowrap"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
                <div>
                  <div className="hidden sm:block w-32 h-4 bg-white/20 rounded mb-1"></div>
                  <div className="sm:hidden w-20 h-4 bg-white/20 rounded"></div>
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-12 ${className}`}>
      <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-2">
        <nav className="flex space-x-2 overflow-x-auto scrollbar-hide" role="tablist">
          {visibleTabs.map(tab => {
            const isActive = currentTab === tab.href;
            
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`group flex items-center space-x-3 px-6 py-4 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap transform hover:scale-105 relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-xl shadow-purple-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/10'
                }`}
                aria-current={isActive ? 'page' : undefined}
                role="tab"
                aria-selected={isActive}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-violet-400/20 animate-pulse"></div>
                )}
                
                <div className={`relative z-10 p-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/10 text-gray-400 group-hover:bg-white/20 group-hover:text-white'
                }`}>
                  {tab.icon}
                </div>
                
                <div className="relative z-10">
                  <span className="hidden sm:inline font-bold">{tab.name}</span>
                  <span className="sm:hidden font-bold">{tab.shortName}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white/50 rounded-full"></div>
                  )}
                </div>
                
                {/* Hover effect */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default NavigationTabs;
