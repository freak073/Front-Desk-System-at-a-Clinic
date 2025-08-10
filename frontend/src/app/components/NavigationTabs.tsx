import React from 'react';
import Link from 'next/link';

const tabs = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Queue', href: '/dashboard/queue' },
  { name: 'Appointments', href: '/dashboard/appointments' },
  { name: 'Doctors', href: '/dashboard/doctors' },
  { name: 'Patients', href: '/dashboard/patients' },
];

interface NavigationTabsProps {
  pathname: string;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({ pathname }) => {
  return (
    <nav className="bg-gray-800 border-b border-gray-700 flex gap-1 px-6 py-3">
      {tabs.map(tab => {
        const isActive = pathname === tab.href || (pathname?.startsWith(tab.href) && tab.href !== '/dashboard');
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
              isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationTabs;
