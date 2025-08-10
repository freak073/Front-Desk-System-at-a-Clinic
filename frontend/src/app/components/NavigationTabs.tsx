import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Queue', href: '/dashboard/queue' },
  { name: 'Appointments', href: '/dashboard/appointments' },
  { name: 'Doctors', href: '/dashboard/doctors' },
  { name: 'Patients', href: '/dashboard/patients' },
];

interface NavigationTabsProps {}

// Simplified: always use route navigation
const NavigationTabs: React.FC<NavigationTabsProps> = () => {
  const pathname = usePathname();
  
  const currentTab = (() => {
    for (const tab of tabs) {
      if (pathname === tab.href || (pathname?.startsWith(tab.href) && tab.href !== '/dashboard')) {
        return tab.href;
      }
    }
    return '/dashboard';
  })();

  return (
    <nav className="bg-gray-800 border-b border-gray-700 flex gap-1 px-6 py-3">
      {tabs.map(tab => {
        const isActive = currentTab === tab.href || 
                         (currentTab?.startsWith(tab.href) && tab.href !== '/dashboard');
        
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
              isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationTabs;
