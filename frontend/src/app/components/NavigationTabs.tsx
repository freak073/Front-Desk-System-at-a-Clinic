'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const tabs = [
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
  const router = useRouter();
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
    
    for (const tab of tabs) {
      if (pathname === tab.href || pathname.startsWith(tab.href + '/')) {
        return tab.href;
      }
    }
    return null;
  };

  const currentTab = getCurrentTab();

  if (!isClient) {
    return (
      <div className={`mb-6 ${className}`}>
        <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <div
              key={tab.name}
              className="px-4 py-2 rounded-md text-sm font-medium bg-surface-800 text-gray-400 animate-pulse whitespace-nowrap"
            >
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.shortName}</span>
            </div>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className={`mb-6 ${className}`}>
      <nav className="flex space-x-1 overflow-x-auto scrollbar-hide" role="tablist">
        {tabs.map(tab => {
          const isActive = currentTab === tab.href;
          
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-surface-900 ${
                isActive
                  ? 'bg-accent-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-surface-800'
              }`}
              aria-current={isActive ? 'page' : undefined}
              role="tab"
              aria-selected={isActive}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.shortName}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default NavigationTabs;
