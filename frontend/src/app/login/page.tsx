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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/40 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 3}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Modern Card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-purple-500/10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Front Desk System
              </h1>
              <p className="text-purple-200/80 text-sm">
                {isSignupMode ? 'Create your account to get started' : 'Welcome to the Clinic Front Desk Management System'}
              </p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Username Field */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-purple-200/90">
                  {isSignupMode ? 'Name*' : 'Username'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                    placeholder={isSignupMode ? "Enter your name" : "Enter your username"}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    disabled={loading}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 pointer-events-none"></div>
                </div>
              </div>

              {/* Full Name Field (Signup only) */}
              {isSignupMode && (
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-sm font-medium text-purple-200/90">
                    Email*
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="fullName"
                      name="fullName"
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter your email"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      disabled={loading}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 pointer-events-none"></div>
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-purple-200/90">
                  Password*
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                    placeholder={isSignupMode ? "Create a password" : "Enter your password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 pointer-events-none"></div>
                </div>
                {isSignupMode && (
                  <p className="text-xs text-purple-300/60 mt-2">
                    Must be at least 9 characters.
                  </p>
                )}
              </div>

              {/* Role Field (Signup only) */}
              {isSignupMode && (
                <div className="space-y-2">
                  <label htmlFor="role" className="block text-sm font-medium text-purple-200/90">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      name="role"
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                      value={role}
                      onChange={e => setRole(e.target.value as 'admin' | 'staff')}
                      disabled={loading}
                    >
                      <option value="staff" className="bg-slate-800 text-white">Staff</option>
                      <option value="admin" className="bg-slate-800 text-white">Admin</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 pointer-events-none"></div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {(formError || error) && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm text-center backdrop-blur-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formError || error}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-purple-500/20"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{isSignupMode ? 'Creating account...' : 'Signing in...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>{isSignupMode ? 'Create account' : 'Login to Dashboard'}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Social Login Buttons (Signup only) */}
              {isSignupMode && (
                <div className="space-y-3 pt-2">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-transparent text-purple-300/60">Or continue with</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="flex items-center justify-center px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-all duration-300 backdrop-blur-sm group"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span className="text-sm">Google</span>
                    </button>

                    <button
                      type="button"
                      className="flex items-center justify-center px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-all duration-300 backdrop-blur-sm group"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                      <span className="text-sm">Apple</span>
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Toggle Mode */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-purple-300/80 hover:text-white text-sm transition-colors duration-300 hover:underline"
                disabled={loading}
              >
                {isSignupMode
                  ? 'Already have an account? Sign in'
                  : 'Need an account? Sign up here'
                }
              </button>
            </div>

            {/* Default Credentials (Login only) */}
            {!isSignupMode && (
              <div className="mt-8 text-center">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <p className="text-xs text-purple-300/80 font-medium">Default credentials:</p>
                  </div>
                  <div className="text-xs text-purple-200/70 bg-white/5 rounded-lg p-2 font-mono">
                    <p>Staff: staff / Staff123</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}