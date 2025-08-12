import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GlobalStateProvider, useGlobalState } from '../GlobalStateContext';
import { ToastProvider } from '../../app/components/ToastProvider';
import { AuthProvider } from '../AuthContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Mock API service
jest.mock('../../lib/api', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>
      <AuthProvider>
        <GlobalStateProvider>
          {children}
        </GlobalStateProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

describe('GlobalStateContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('should provide initial state', () => {
    const { result } = renderHook(() => useGlobalState(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state.sidebarOpen).toBe(false);
    expect(result.current.state.theme).toBe('dark');
    expect(result.current.state.isOnline).toBe(true);
    expect(result.current.state.lastSyncTime).toBe(null);
    expect(result.current.state.loadingStates.queue).toBe(false);
    expect(result.current.state.errors.queue).toBe(null);
    expect(result.current.state.optimisticUpdates).toEqual({});
    expect(result.current.state.syncStatus.queue).toBe('idle');
  });

  it('should update sidebar state', () => {
    const { result } = renderHook(() => useGlobalState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSidebarOpen(true);
    });

    expect(result.current.state.sidebarOpen).toBe(true);
  });

  it('should update theme state', () => {
    const { result } = renderHook(() => useGlobalState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.state.theme).toBe('light');
  });

  it('should update loading states', () => {
    const { result } = renderHook(() => useGlobalState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setLoadingState('queue', true);
    });

    expect(result.current.state.loadingStates.queue).toBe(true);
    expect(result.current.isLoading('queue')).toBe(true);
    expect(result.current.isLoading()).toBe(true);
  });

  it('should update error states', () => {
    const { result } = renderHook(() => useGlobalState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setErrorState('appointments', 'Network error');
    });

    expect(result.current.state.errors.appointments).toBe('Network error');
    expect(result.current.hasError('appointments')).toBe(true);
    expect(result.current.hasError()).toBe(true);
    expect(result.current.getError('appointments')).toBe('Network error');
  });

  it('should manage optimistic updates', () => {
    const { result } = renderHook(() => useGlobalState(), {
      wrapper: createWrapper(),
    });

    const updateData = { id: 1, name: 'Test' };

    act(() => {
      result.current.addOptimisticUpdate('test-1', 'create', updateData);
    });

    expect(Object.keys(result.current.state.optimisticUpdates)).toHaveLength(1);
    expect(result.current.state.optimisticUpdates['test-1'].type).toBe('create');
    expect(result.current.state.optimisticUpdates['test-1'].data).toEqual(updateData);

    act(() => {
      result.current.removeOptimisticUpdate('test-1');
    });

    expect(Object.keys(result.current.state.optimisticUpdates)).toHaveLength(0);
  });

  it('should clear all optimistic updates', () => {
    const { result } = renderHook(() => useGlobalState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.addOptimisticUpdate('test-1', 'create', { id: 1 });
      result.current.addOptimisticUpdate('test-2', 'update', { id: 2 });
    });

    expect(Object.keys(result.current.state.optimisticUpdates)).toHaveLength(2);

    act(() => {
      result.current.clearOptimisticUpdates();
    });

    expect(Object.keys(result.current.state.optimisticUpdates)).toHaveLength(0);
  });

  it('should update sync status', () => {
    const { result } = renderHook(() => useGlobalState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSyncStatus('queue', 'syncing');
    });

    expect(result.current.state.syncStatus.queue).toBe('syncing');
    expect(result.current.isSyncing('queue')).toBe(true);
    expect(result.current.isSyncing()).toBe(true);

    act(() => {
      result.current.setSyncStatus('queue', 'idle');
    });

    expect(result.current.state.syncStatus.queue).toBe('idle');
    expect(result.current.state.lastSyncTime).toBeGreaterThan(0);
  });

  it('should handle online/offline status', () => {
    const { result } = renderHook(() => useGlobalState(), {
      wrapper: createWrapper(),
    });

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.state.isOnline).toBe(false);

    // Simulate going online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.state.isOnline).toBe(true);
  });

  it('should auto-clear old optimistic updates', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useGlobalState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.addOptimisticUpdate('test-1', 'create', { id: 1 });
    });

    expect(Object.keys(result.current.state.optimisticUpdates)).toHaveLength(1);

    // Fast-forward time by 35 seconds (past the 30-second threshold)
    act(() => {
      jest.advanceTimersByTime(35000);
    });

    // The cleanup runs every 5 seconds, so we need to advance a bit more
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(Object.keys(result.current.state.optimisticUpdates)).toHaveLength(0);

    jest.useRealTimers();
  });

  it('should persist theme to localStorage', () => {
    const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
    
    const { result } = renderHook(() => useGlobalState(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setTheme('light');
    });

    expect(mockSetItem).toHaveBeenCalledWith('theme', 'light');
    
    mockSetItem.mockRestore();
  });

  it('should load theme from localStorage on mount', () => {
    const mockGetItem = jest.spyOn(Storage.prototype, 'getItem');
    mockGetItem.mockReturnValue('light');

    const { result } = renderHook(() => useGlobalState(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state.theme).toBe('light');
    
    mockGetItem.mockRestore();
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useGlobalState());
    }).toThrow('useGlobalState must be used within a GlobalStateProvider');
    
    consoleSpy.mockRestore();
  });
});