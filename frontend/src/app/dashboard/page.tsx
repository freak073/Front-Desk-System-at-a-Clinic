'use client';
import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import NavigationTabs from '../components/NavigationTabs';
import { fetchDashboardStats, DashboardStats } from './dashboard.service';



interface DashboardPageProps {
  readonly pathname?: string;
}


export default function DashboardPage(props: DashboardPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const hookPath = usePathname();
  const currentPath = typeof props.pathname === 'string' ? props.pathname : hookPath;
  const [stats, setStats] = useState<DashboardStats>({
    queueCount: 0,
    todayAppointments: 0,
    availableDoctors: 0,
    averageWaitTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    const loadDashboardStats = async () => {
      try {
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Header />
      <NavigationTabs pathname={currentPath} />
      <main className="flex-1 p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome, {user.username}!</h2>
          <p className="text-gray-400">Select a tab to manage queues, appointments, doctors, or patients.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 hover:border-blue-500 transition-all duration-300">
            <h3 className="text-lg font-medium text-gray-200 mb-2">Current Queue</h3>
            <div className={`text-3xl font-bold text-blue-400 ${loading ? 'animate-pulse' : ''}`}>
              {loading ? '-' : stats.queueCount}
            </div>
            <p className="text-gray-400 text-sm">Patients waiting</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 hover:border-green-500 transition-all duration-300">
            <h3 className="text-lg font-medium text-gray-200 mb-2">Today's Appointments</h3>
            <div className={`text-3xl font-bold text-green-400 ${loading ? 'animate-pulse' : ''}`}>
              {loading ? '-' : stats.todayAppointments}
            </div>
            <p className="text-gray-400 text-sm">Scheduled today</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 hover:border-purple-500 transition-all duration-300">
            <h3 className="text-lg font-medium text-gray-200 mb-2">Available Doctors</h3>
            <div className={`text-3xl font-bold text-purple-400 ${loading ? 'animate-pulse' : ''}`}>
              {loading ? '-' : stats.availableDoctors}
            </div>
            <p className="text-gray-400 text-sm">Currently available</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 hover:border-orange-500 transition-all duration-300">
            <h3 className="text-lg font-medium text-gray-200 mb-2">Average Wait Time</h3>
            <div className={`text-3xl font-bold text-orange-400 ${loading ? 'animate-pulse' : ''}`}>
              {loading ? '-' : `${stats.averageWaitTime}m`}
            </div>
            <p className="text-gray-400 text-sm">Minutes</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            href="/dashboard/appointments/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition flex items-center gap-2 justify-center shadow-md hover:shadow-lg"
          >
            <span className="text-xl">+</span> New Appointment
          </Link>
          <Link
            href="/dashboard/queue/add"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition flex items-center gap-2 justify-center shadow-md hover:shadow-lg"
          >
            <span className="text-xl">+</span> Add to Queue
          </Link>
        </div>
        
        {/* Routed content for each tab will be rendered here in future tasks */}
      </main>
    </div>
  );
}
