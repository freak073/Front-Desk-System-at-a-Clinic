"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { apiService } from '../lib/api';
import { User, AuthResponse, LoginDto } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginDto) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = Cookies.get('auth_token');
    if (storedToken) {
      setToken(storedToken);
      setUser(jwtDecode<User>(storedToken));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!token) return;
    const decoded = jwtDecode<{ exp: number }>(token);
    const exp = decoded.exp * 1000;
    const now = Date.now();
    const timeout = exp - now - 60000;
    if (timeout > 0) {
      const timer = setTimeout(async () => {
        try {
          const res = await apiService.post<AuthResponse['data']>('/auth/refresh', { token });
          if (res.success && res.data) {
            setToken(res.data.token);
            Cookies.set('auth_token', res.data.token);
            setUser(jwtDecode<User>(res.data.token));
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }, timeout);
      return () => clearTimeout(timer);
    } else {
      logout();
    }
  }, [token]);

  const login = async (data: LoginDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.post<AuthResponse['data']>('/auth/login', data);
      if (res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        Cookies.set('auth_token', res.data.token);
        router.push('/dashboard');
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await apiService.post('/auth/logout');
    setUser(null);
    setToken(null);
    Cookies.remove('auth_token');
    router.push('/login');
  };

  const refreshToken = async () => {
    if (!token) return;
    try {
      const res = await apiService.post<AuthResponse['data']>('/auth/refresh', { token });
      if (res.success && res.data) {
        setToken(res.data.token);
        Cookies.set('auth_token', res.data.token);
        setUser(jwtDecode<User>(res.data.token));
      } else {
        logout();
      }
    } catch {
      logout();
    }
  };

  const contextValue = React.useMemo(() => ({
    user,
    token,
    loading,
    error,
    login,
    logout,
    refreshToken,
  }), [user, token, loading, error]);
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
