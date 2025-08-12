'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '../app/components/ToastProvider';

// Global state types
interface GlobalState {
  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  
  // Real-time connection state
  isOnline: boolean;
  lastSyncTime: number | null;
  
  // Loading states for different operations
  loadingStates: {
    queue: boolean;
    appointments: boolean;
    doctors: boolean;
    patients: boolean;
  };
  
  // Error states
  errors: {
    queue: string | null;
    appointments: string | null;
    doctors: string | null;
    patients: string | null;
  };
  
  // Optimistic updates tracking
  optimisticUpdates: {
    [key: string]: {
      id: string;
      type: 'create' | 'update' | 'delete';
      timestamp: number;
      data: any;
    };
  };
  
  // Real-time data sync status
  syncStatus: {
    queue: 'idle' | 'syncing' | 'error';
    appointments: 'idle' | 'syncing' | 'error';
    doctors: 'idle' | 'syncing' | 'error';
  };
}

// Action types
type GlobalAction =
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_LAST_SYNC_TIME'; payload: number }
  | { type: 'SET_LOADING_STATE'; payload: { key: keyof GlobalState['loadingStates']; loading: boolean } }
  | { type: 'SET_ERROR_STATE'; payload: { key: keyof GlobalState['errors']; error: string | null } }
  | { type: 'ADD_OPTIMISTIC_UPDATE'; payload: { id: string; type: 'create' | 'update' | 'delete'; data: any } }
  | { type: 'REMOVE_OPTIMISTIC_UPDATE'; payload: string }
  | { type: 'CLEAR_OPTIMISTIC_UPDATES' }
  | { type: 'SET_SYNC_STATUS'; payload: { key: keyof GlobalState['syncStatus']; status: 'idle' | 'syncing' | 'error' } }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: GlobalState = {
  sidebarOpen: false,
  theme: 'dark',
  isOnline: true,
  lastSyncTime: null,
  loadingStates: {
    queue: false,
    appointments: false,
    doctors: false,
    patients: false,
  },
  errors: {
    queue: null,
    appointments: null,
    doctors: null,
    patients: null,
  },
  optimisticUpdates: {},
  syncStatus: {
    queue: 'idle',
    appointments: 'idle',
    doctors: 'idle',
  },
};

// Reducer
function globalStateReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    
    case 'SET_LAST_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload };
    
    case 'SET_LOADING_STATE':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.key]: action.payload.loading,
        },
      };
    
    case 'SET_ERROR_STATE':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error,
        },
      };
    
    case 'ADD_OPTIMISTIC_UPDATE':
      return {
        ...state,
        optimisticUpdates: {
          ...state.optimisticUpdates,
          [action.payload.id]: {
            id: action.payload.id,
            type: action.payload.type,
            timestamp: Date.now(),
            data: action.payload.data,
          },
        },
      };
    
    case 'REMOVE_OPTIMISTIC_UPDATE':
      const { [action.payload]: removed, ...remainingUpdates } = state.optimisticUpdates;
      return {
        ...state,
        optimisticUpdates: remainingUpdates,
      };
    
    case 'CLEAR_OPTIMISTIC_UPDATES':
      return {
        ...state,
        optimisticUpdates: {},
      };
    
    case 'SET_SYNC_STATUS':
      return {
        ...state,
        syncStatus: {
          ...state.syncStatus,
          [action.payload.key]: action.payload.status,
        },
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Context type
interface GlobalStateContextType {
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
  
  // Convenience methods
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoadingState: (key: keyof GlobalState['loadingStates'], loading: boolean) => void;
  setErrorState: (key: keyof GlobalState['errors'], error: string | null) => void;
  addOptimisticUpdate: (id: string, type: 'create' | 'update' | 'delete', data: any) => void;
  removeOptimisticUpdate: (id: string) => void;
  clearOptimisticUpdates: () => void;
  setSyncStatus: (key: keyof GlobalState['syncStatus'], status: 'idle' | 'syncing' | 'error') => void;
  
  // User state management
  setUser: (user: any) => void;
  
  // Utility methods
  isLoading: (key?: keyof GlobalState['loadingStates']) => boolean;
  hasError: (key?: keyof GlobalState['errors']) => boolean;
  getError: (key: keyof GlobalState['errors']) => string | null;
  isSyncing: (key?: keyof GlobalState['syncStatus']) => boolean;
}

// Create context
const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

// Provider component
export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(globalStateReducer, initialState);
  
  // We'll get the user from AuthContext later, not during initialization
  const [user, setUser] = useState<any>(null);
  
  const { error: showError, success: showSuccess } = useToast();

  // Monitor online status (client-side only)
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
      showSuccess('Connection restored');
    };
    
    const handleOffline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
      showError('Connection lost. Some features may not work properly.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial online status
    dispatch({ type: 'SET_ONLINE_STATUS', payload: navigator.onLine });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showError, showSuccess]);

  // Reset state when user logs out - we'll handle this differently
  // The AuthProvider will manage user state, we just manage global UI state

  // Auto-clear old optimistic updates (after 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const thirtySecondsAgo = now - 30000;
      
      Object.entries(state.optimisticUpdates).forEach(([id, update]) => {
        if (update.timestamp < thirtySecondsAgo) {
          dispatch({ type: 'REMOVE_OPTIMISTIC_UPDATE', payload: id });
        }
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [state.optimisticUpdates]);

  // Convenience methods
  const setSidebarOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme });
    // Persist theme preference (client-side only)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, []);

  const setLoadingState = useCallback((key: keyof GlobalState['loadingStates'], loading: boolean) => {
    dispatch({ type: 'SET_LOADING_STATE', payload: { key, loading } });
  }, []);

  const setErrorState = useCallback((key: keyof GlobalState['errors'], error: string | null) => {
    dispatch({ type: 'SET_ERROR_STATE', payload: { key, error } });
    
    // Show toast notification for errors
    if (error) {
      showError(`${key.charAt(0).toUpperCase() + key.slice(1)} error: ${error}`);
    }
  }, [showError]);

  const addOptimisticUpdate = useCallback((id: string, type: 'create' | 'update' | 'delete', data: any) => {
    dispatch({ type: 'ADD_OPTIMISTIC_UPDATE', payload: { id, type, data } });
  }, []);

  const removeOptimisticUpdate = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_OPTIMISTIC_UPDATE', payload: id });
  }, []);

  const clearOptimisticUpdates = useCallback(() => {
    dispatch({ type: 'CLEAR_OPTIMISTIC_UPDATES' });
  }, []);

  const setSyncStatus = useCallback((key: keyof GlobalState['syncStatus'], status: 'idle' | 'syncing' | 'error') => {
    dispatch({ type: 'SET_SYNC_STATUS', payload: { key, status } });
    
    // Update last sync time when sync completes successfully
    if (status === 'idle') {
      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: Date.now() });
    }
  }, []);

  const setUserState = useCallback((newUser: any) => {
    setUser(newUser);
    // Reset state when user logs out
    if (!newUser) {
      dispatch({ type: 'RESET_STATE' });
    }
  }, []);

  // Utility methods
  const isLoading = useCallback((key?: keyof GlobalState['loadingStates']) => {
    if (key) {
      return state.loadingStates[key];
    }
    return Object.values(state.loadingStates).some(loading => loading);
  }, [state.loadingStates]);

  const hasError = useCallback((key?: keyof GlobalState['errors']) => {
    if (key) {
      return state.errors[key] !== null;
    }
    return Object.values(state.errors).some(error => error !== null);
  }, [state.errors]);

  const getError = useCallback((key: keyof GlobalState['errors']) => {
    return state.errors[key];
  }, [state.errors]);

  const isSyncing = useCallback((key?: keyof GlobalState['syncStatus']) => {
    if (key) {
      return state.syncStatus[key] === 'syncing';
    }
    return Object.values(state.syncStatus).some(status => status === 'syncing');
  }, [state.syncStatus]);

  // Load theme from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        dispatch({ type: 'SET_THEME', payload: savedTheme });
      }
    }
  }, []);

  const contextValue: GlobalStateContextType = {
    state,
    dispatch,
    setSidebarOpen,
    setTheme,
    setLoadingState,
    setErrorState,
    addOptimisticUpdate,
    removeOptimisticUpdate,
    clearOptimisticUpdates,
    setSyncStatus,
    setUser: setUserState,
    isLoading,
    hasError,
    getError,
    isSyncing,
  };

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
};

// Hook to use global state
export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

// Hook to sync auth state with global state
export const useAuthSync = () => {
  const { setUser } = useGlobalState();
  
  useEffect(() => {
    try {
      const { user } = useAuth();
      setUser(user);
    } catch (error) {
      // AuthProvider not available, ignore
      console.debug('AuthProvider not available for sync');
    }
  }, [setUser]);
};