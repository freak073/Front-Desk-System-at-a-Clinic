"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiService } from "../lib/api";
import { User, AuthResponse, LoginDto, SignupDto } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginDto) => Promise<void>;
  signup: (data: SignupDto) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate token before setting user
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const storedToken = Cookies.get("auth_token");
      if (storedToken) {
        try {
          const decoded = jwtDecode<User & { exp: number }>(storedToken);
          const isExpired = decoded.exp * 1000 < Date.now();
          if (!isExpired) {
            setUser(decoded);
            setToken(storedToken);
            // Verify token with backend
            try {
              await apiService.get("/auth/verify");
            } catch (error) {
              console.warn("Token verification failed");
              setUser(null);
              setToken(null);
              Cookies.remove("auth_token");
            }
          } else {
            console.warn("Token expired, removing.");
            setUser(null);
            setToken(null);
            Cookies.remove("auth_token");
          }
        } catch (err) {
          console.warn("Invalid stored token, removing.", err);
          setUser(null);
          setToken(null);
          Cookies.remove("auth_token");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Auto-refresh before expiry
  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      const exp = decoded.exp * 1000;
      const now = Date.now();
      const timeout = exp - now - 60000;

      if (timeout > 0) {
        const timer = setTimeout(refreshToken, timeout);
        return () => clearTimeout(timer);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }, [token]);

  const handleAuthResponse = async (res: any, action: string) => {
    console.log(`${action} response:`, res);
    
    // Handle all possible token locations in the response
    const responseData = res as unknown as {
      data?: { token?: string; access_token?: string };
      token?: string;
      access_token?: string;
    };

    const token = responseData.data?.token || 
                 responseData.data?.access_token || 
                 responseData.token || 
                 responseData.access_token;
    
    if (!token) {
      console.error(`No token in ${action} response:`, JSON.stringify(responseData, null, 2));
      throw new Error('No token received from server');
    }
    
    try {
      const decodedUser = jwtDecode<User & { exp: number }>(token);
      const isExpired = decodedUser.exp * 1000 < Date.now();
      
      if (!isExpired) {
        // Set cookie first with secure options
        Cookies.set("auth_token", token, { 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
        
        // Then update state
        setToken(token);
        setUser(decodedUser);
        
        // Add a small delay before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace("/dashboard");
      } else {
        throw new Error(`Token expired immediately after ${action}.`);
      }
    } catch (err) {
      console.error(`Token decode error in ${action}:`, err);
      throw new Error("Invalid authentication token");
    }
  };

  const login = async (data: LoginDto) => {
    if (loading) return; // Prevent multiple simultaneous login attempts
    setLoading(true);
    setError(null);
    try {
      console.log('Login attempt with:', { username: data.username });
      const res = await apiService.post<AuthResponse["data"]>("/auth/login", {
        username: data.username,
        password: data.password
      });
      
      await handleAuthResponse(res, 'Login');
    } catch (err: any) {
      console.error("Login error:", err);
      setUser(null);
      setToken(null);
      Cookies.remove("auth_token");
      
      // More detailed error handling
      if (err.response?.status === 401) {
        setError("Invalid username or password");
      } else if (!err.response) {
        setError("Cannot connect to server. Please try again.");
      } else {
        setError(err.response?.data?.message || err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupDto) => {
    if (loading) return; // Prevent multiple simultaneous signup attempts
    setLoading(true);
    setError(null);
    try {
      console.log('Signup attempt with:', { username: data.username, role: data.role });
      const res = await apiService.post<AuthResponse["data"]>("/auth/signup", {
        username: data.username,
        password: data.password,
        role: data.role || 'staff',
        fullName: data.fullName
      });
      
      await handleAuthResponse(res, 'Signup');
    } catch (err: any) {
      console.error("Signup error:", err);
      setUser(null);
      setToken(null);
      Cookies.remove("auth_token");
      
      // More detailed error handling
      if (err.response?.status === 409) {
        setError("Username already exists. Please choose a different username.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Invalid signup data. Please check your input.");
      } else if (!err.response) {
        setError("Cannot connect to server. Please try again.");
      } else {
        setError(err.response?.data?.message || err.message || "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiService.post("/auth/logout");
    } catch {
      // ignore server errors
    } finally {
      // Clear everything in the correct order
      Cookies.remove("auth_token");
      setToken(null);
      setUser(null);
      setLoading(false);
      // Use replace instead of push to prevent back button issues
      router.replace("/login");
    }
  };

  const refreshToken = async () => {
    if (!token) return;
    try {
      const res = await apiService.post<AuthResponse["data"]>("/auth/refresh", { token });
      if (res.success && res.data?.token) {
        try {
          const decodedUser = jwtDecode<User & { exp: number }>(res.data.token);
          const isExpired = decodedUser.exp * 1000 < Date.now();
          if (!isExpired) {
            setUser(decodedUser);
            setToken(res.data.token);
            Cookies.set("auth_token", res.data.token);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      } else {
        logout();
      }
    } catch {
      logout();
    }
  };

  const contextValue = React.useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      signup,
      logout,
      refreshToken,
    }),
    [user, token, loading, error]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
