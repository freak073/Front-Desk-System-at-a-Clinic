"use client";
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const { user, login, loading, error } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!username || !password) {
      setFormError('Please enter both username and password.');
      return;
    }
    await login({ username, password });
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-surface-900 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_60%)]">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Login to Front Desk System
        </h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="input-field"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="input-field"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          {(formError || error) && (
            <div className="text-red-400 text-sm text-center">{formError || error}</div>
          )}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}