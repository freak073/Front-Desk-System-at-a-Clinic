"use client";
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const { user, login, signup, loading, error } = useAuth();
  const router = useRouter();
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
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

    if (isSignupMode) {
      // Additional validation for signup
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        return;
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        setFormError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
        return;
      }
      if (username.length < 3) {
        setFormError('Username must be at least 3 characters long.');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setFormError('Username can only contain letters, numbers, and underscores.');
        return;
      }
      
      await signup({ username, password, role, fullName: fullName || undefined });
    } else {
      await login({ username, password });
    }
  };

  const toggleMode = () => {
    setIsSignupMode(!isSignupMode);
    setFormError(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setRole('staff');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_60%)]">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          {isSignupMode ? 'Create Account' : 'Login to Front Desk System'}
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
            {isSignupMode && (
              <p className="text-xs text-gray-400 mt-1">
                Must be at least 6 characters with uppercase, lowercase, and number
              </p>
            )}
          </div>

          {isSignupMode && (
            <>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className="input-field"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  className="input-field"
                  value={role}
                  onChange={e => setRole(e.target.value as 'admin' | 'staff')}
                  disabled={loading}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          {(formError || error) && (
            <div className="text-red-400 text-sm text-center">{formError || error}</div>
          )}
          
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading 
              ? (isSignupMode ? 'Creating Account...' : 'Logging in...') 
              : (isSignupMode ? 'Create Account' : 'Login')
            }
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-blue-400 hover:text-blue-300 text-sm underline"
            disabled={loading}
          >
            {isSignupMode 
              ? 'Already have an account? Login here' 
              : 'Need an account? Sign up here'
            }
          </button>
        </div>

        {!isSignupMode && (
          <div className="mt-4 text-center text-xs text-gray-400">
            <p>Default credentials:</p>
            <p>Admin: admin / Admin123</p>
            <p>Staff: staff / Staff123</p>
          </div>
        )}
      </div>
    </div>
  );
}