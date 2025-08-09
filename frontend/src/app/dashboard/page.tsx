import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <div className="font-bold text-xl">Clinic Front Desk Dashboard</div>
        <div className="flex items-center gap-4">
          <span className="text-gray-700">{user.username}</span>
          <button className="btn-secondary" onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-semibold mb-4">Welcome, {user.username}!</h2>
        <p className="mb-6">Select a tab to manage queues, appointments, or doctors.</p>
        {/* NavigationTabs and routed content will be added in next tasks */}
      </main>
    </div>
  );
}
