import axios, { AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(new Error(error.message));
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle auth responses specially (login/signup)
    if ((response.config.url === '/auth/login' || response.config.url === '/auth/signup') && 
        response.data.data?.access_token) {
      Cookies.set('auth_token', response.data.data.access_token);
      return {
        ...response,
        data: {
          success: true,
          data: response.data.data
        }
      } as AxiosResponse;
    }
    return response;
  },
  (error: AxiosError) => {
    if (!error.response) {
      // Network error or server not running
      return Promise.reject(new Error('Unable to connect to the server. Please make sure the backend server is running.'));
    }
    
    if (error.response.status === 401) {
      // Handle unauthorized access
      Cookies.remove('auth_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const errorMessage = 
      (error.response.data as { message?: string })?.message || 
      error.message || 
      'An unexpected error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface LoginResponse {
  access_token: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Generic API methods
// Helper to normalize responses (backend currently returns raw arrays/objects, not enveloped)
function normalizeResponse<T>(raw: any): ApiResponse<T> {
  // If already in expected ApiResponse shape (has success flag)
  if (raw && typeof raw === 'object' && 'success' in raw) {
    return raw as ApiResponse<T>;
  }
  // If looks like envelope with data but no success property
  if (raw && typeof raw === 'object' && 'data' in raw && !Array.isArray(raw)) {
    const base: any = { success: true, ...raw };
    return base as ApiResponse<T>;
  }
  // Otherwise wrap raw payload (array, object, primitive) into data
  return { success: true, data: raw as T };
}

export const apiService = {
  get: <T>(url: string, params?: any): Promise<ApiResponse<T>> =>
    api.get(url, { params }).then(res => normalizeResponse<T>(res.data)),
    
  post: <T>(url: string, data?: any): Promise<ApiResponse<T>> =>
    api.post(url, data).then(res => {
      console.log('API POST Response:', res.config.url, res.status);
      return normalizeResponse<T>(res.data);
    }),
    
  put: <T>(url: string, data?: any): Promise<ApiResponse<T>> =>
    api.put(url, data).then(res => normalizeResponse<T>(res.data)),
  
  patch: <T>(url: string, data?: any): Promise<ApiResponse<T>> =>
    api.patch(url, data).then(res => normalizeResponse<T>(res.data)),
    
  delete: <T>(url: string): Promise<ApiResponse<T>> =>
    api.delete(url).then(res => normalizeResponse<T>(res.data)),
};
