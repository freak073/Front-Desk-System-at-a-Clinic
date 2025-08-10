import React from 'react';
import Link from 'next/link';

const tabs = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Appointments', href: '/dashboard/appointments' },
  { name: 'Doctors', href: '/dashboard/doctors' },
  { name: 'Patients', href: '/dashboard/patients' },
  { name: 'Queue', href: '/dashboard/queue' },
];

interface NavigationTabsProps {
  pathname: string;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({ pathname }) => {
  return (
    <nav className="bg-gray-100 border-b flex gap-2 px-6 py-2">
      {tabs.map(tab => {
        const isActive = pathname === tab.href || (pathname?.startsWith(tab.href) && tab.href !== '/dashboard');
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`px-4 py-2 rounded font-medium transition-colors ${isActive ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-blue-100'}`}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationTabs;
