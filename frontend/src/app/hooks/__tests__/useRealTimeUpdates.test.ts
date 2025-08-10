import { renderHook, act } from '@testing-library/react';
import { useRealTimeUpdates } from '../useRealTimeUpdates';

// Mock the apiService
jest.mock('../../../lib/api', () => ({
  apiService: {
    get: jest.fn(),
  },
}));

// Mock react-query
jest.mock('react-query', () => ({
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

describe('useRealTimeUpdates', () => {
  const mockUseQuery = require('react-query').useQuery;
  const mockUseQueryClient = require('react-query').useQueryClient;
  const mockApiService = require('../../../lib/api').apiService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return query result with additional properties', () => {
    const mockData = { data: [{ id: 1, name: 'Test' }], timestamp: Date.now() };
    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      isFetching: false,
    });
    
    const { result } = renderHook(() => 
      useRealTimeUpdates('test-key', '/test-endpoint')
    );
    
    expect(result.current.data).toEqual(mockData.data);
    expect(result.current.lastUpdated).toBeDefined();
    expect(result.current.isPolling).toBeDefined();
  });

  it('should handle loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: true,
    });
    
    const { result } = renderHook(() => 
      useRealTimeUpdates('test-key', '/test-endpoint')
    );
    
    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const mockError = new Error('Test error');
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
      isFetching: false,
    });
    
    const { result } = renderHook(() => 
      useRealTimeUpdates('test-key', '/test-endpoint')
    );
    
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });
});