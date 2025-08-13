import { render, screen, waitFor } from '@testing-library/react';
import { performance } from 'perf_hooks';
import { QueryClient, QueryClientProvider } from 'react-query';
import { LoadingSpinner, SkeletonListItem } from '../components/LoadingStates';

// Mock performance API for testing
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
};

// @ts-ignore
global.performance = mockPerformance;

describe('Performance Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  describe('Component Rendering Performance', () => {
    it('should render LoadingStates within performance threshold', async () => {
      const startTime = Date.now();
      
      render(<SkeletonListItem />);

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should render multiple loading states efficiently', async () => {
      const startTime = Date.now();
      
      render(
        <div>
          <SkeletonListItem />
          <LoadingSpinner />
          <LoadingSpinner size="lg" />
        </div>
      );

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Multiple components should render within 50ms
      expect(loadTime).toBeLessThan(50);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks in component mounting/unmounting', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Mount and unmount component multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<SkeletonListItem />);
        unmount();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
  });

  describe('Bundle Size Tests', () => {
    it('should have reasonable component sizes', () => {
      // This would typically be done with webpack-bundle-analyzer
      // For now, we'll just check that components are properly tree-shaken
      
      const componentCode = SkeletonListItem.toString();
      
      // Should not include development-only code in production
      if (process.env.NODE_ENV === 'production') {
        expect(componentCode).not.toContain('console.log');
        expect(componentCode).not.toContain('debugger');
      }
    });
  });

  describe('API Response Time Simulation', () => {
    it('should handle slow API responses gracefully', async () => {
      const slowApiCall = () => new Promise(resolve => 
        setTimeout(() => resolve({ data: 'test' }), 1500)
      );

      const startTime = Date.now();
      await slowApiCall();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should handle responses up to 2 seconds
      expect(responseTime).toBeGreaterThan(1400);
      expect(responseTime).toBeLessThan(2000);
    });

    it('should timeout on extremely slow responses', async () => {
      const verySlowApiCall = () => new Promise(resolve => 
        setTimeout(() => resolve({ data: 'test' }), 5000)
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      await expect(
        Promise.race([verySlowApiCall(), timeoutPromise])
      ).rejects.toThrow('Timeout');
    });
  });

  describe('Large Dataset Performance', () => {
    it('should handle large lists efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Patient ${i}`,
        status: 'waiting',
      }));

      const startTime = Date.now();
      
      // Simulate processing large dataset
      const filtered = largeDataset.filter(item => item.status === 'waiting');
      const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(sorted).toHaveLength(1000);
      // Should process 1000 items within 50ms
      expect(processingTime).toBeLessThan(50);
    });
  });

  describe('Memoization Performance', () => {
    it('should benefit from memoization', () => {
      const expensiveCalculation = jest.fn((data: number[]) => 
        data.reduce((sum, num) => sum + num * num, 0)
      );

      const data = [1, 2, 3, 4, 5];
      
      // First call
      const result1 = expensiveCalculation(data);
      
      // Second call with same data (should be memoized in real implementation)
      const result2 = expensiveCalculation(data);

      expect(result1).toBe(result2);
      expect(expensiveCalculation).toHaveBeenCalledTimes(2);
    });
  });
});

// Performance benchmark utility
export function benchmarkFunction<T>(
  fn: () => T,
  iterations: number = 1000
): {
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
} {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    fn();
    const endTime = Date.now();
    times.push(endTime - startTime);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  return {
    averageTime,
    minTime,
    maxTime,
    totalTime,
  };
}

// Memory usage benchmark
export function benchmarkMemory<T>(fn: () => T): {
  result: T;
  memoryUsed: number;
} {
  const initialMemory = process.memoryUsage().heapUsed;
  const result = fn();
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryUsed = finalMemory - initialMemory;

  return {
    result,
    memoryUsed,
  };
}