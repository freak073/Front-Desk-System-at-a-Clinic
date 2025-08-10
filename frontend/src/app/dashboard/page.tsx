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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <NavigationTabs pathname={currentPath} />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-semibold mb-4">Welcome, {user.username}!</h2>
        <p className="mb-6">Select a tab to manage queues, appointments, doctors, or patients.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Current Queue</h3>
            <div className={`text-3xl font-bold text-blue-600 ${loading ? 'animate-pulse' : ''}`}>
              {loading ? '-' : stats.queueCount}
            </div>
            <p className="text-gray-600 text-sm">Patients waiting</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Today's Appointments</h3>
            <div className={`text-3xl font-bold text-green-600 ${loading ? 'animate-pulse' : ''}`}>
              {loading ? '-' : stats.todayAppointments}
            </div>
            <p className="text-gray-600 text-sm">Scheduled today</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Available Doctors</h3>
            <div className={`text-3xl font-bold text-purple-600 ${loading ? 'animate-pulse' : ''}`}>
              {loading ? '-' : stats.availableDoctors}
            </div>
            <p className="text-gray-600 text-sm">Currently available</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Average Wait Time</h3>
            <div className={`text-3xl font-bold text-orange-600 ${loading ? 'animate-pulse' : ''}`}>
              {loading ? '-' : `${stats.averageWaitTime}m`}
            </div>
            <p className="text-gray-600 text-sm">Minutes</p>
          </div>
        </div>
        
        <div className="flex gap-4 mb-8">
          <Link
            href="/dashboard/appointments/new"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition flex items-center gap-2"
          >
            <span className="text-xl">+</span> New Appointment
          </Link>
          <Link
            href="/dashboard/queue/add"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition flex items-center gap-2"
          >
            <span className="text-xl">+</span> Add to Queue
          </Link>
        </div>
        
        {/* Routed content for each tab will be rendered here in future tasks */}
      </main>
    </div>
  );
}
