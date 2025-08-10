/**
 * Performance Dashboard Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { usePerformanceMonitoring } from './PerformanceMonitoringProvider';
import { PERFORMANCE_CONFIG } from '../../lib/performanceMonitoring';

/**
 * Performance Dashboard Component
 * Displays performance metrics in a collapsible panel
 */
export const PerformanceDashboard: React.FC = () => {
  const { metrics, isEnabled, toggleMonitoring, logMetrics, resetMetrics } = usePerformanceMonitoring();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'vitals' | 'components' | 'api' | 'resources'>('vitals');

  // Toggle dashboard visibility
  const toggleDashboard = () => setIsOpen(prev => !prev);

  // Format time in milliseconds
  const formatTime = (time?: number): string => {
    if (time === undefined) return 'N/A';
    return `${time.toFixed(2)}ms`;
  };

  // Determine status color based on threshold
  const getStatusColor = (value: number | undefined, threshold: number | undefined): string => {
    if (value === undefined || threshold === undefined) return 'text-gray-400';
    return value > threshold ? 'text-red-500' : 'text-green-500';
  };

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV !== 'development' && !isEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full md:w-96 bg-white shadow-lg border border-gray-200 rounded-t-lg overflow-hidden">
      {/* Dashboard Header */}
      <div 
        className="flex items-center justify-between px-4 py-2 bg-blue-600 text-white cursor-pointer"
        onClick={toggleDashboard}
      >
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          <h3 className="font-medium">Performance Dashboard</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleMonitoring(); }}
            className={`px-2 py-1 rounded text-xs ${isEnabled ? 'bg-red-500' : 'bg-green-500'}`}
          >
            {isEnabled ? 'Disable' : 'Enable'}
          </button>
          <span className="transform transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
      </div>

      {/* Dashboard Content */}
      {isOpen && (
        <div className="p-4">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'vitals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('vitals')}
            >
              Web Vitals
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'components' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('components')}
            >
              Components
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'api' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('api')}
            >
              API Calls
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'resources' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('resources')}
            >
              Resources
            </button>
          </div>

          {/* Web Vitals Tab */}
          {activeTab === 'vitals' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500">FCP (First Contentful Paint)</div>
                  <div className={`text-lg font-semibold ${getStatusColor(metrics.fcp, PERFORMANCE_CONFIG.THRESHOLDS.FCP)}`}>
                    {formatTime(metrics.fcp)}
                  </div>
                  <div className="text-xs text-gray-400">Threshold: {PERFORMANCE_CONFIG.THRESHOLDS.FCP}ms</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500">LCP (Largest Contentful Paint)</div>
                  <div className={`text-lg font-semibold ${getStatusColor(metrics.lcp, PERFORMANCE_CONFIG.THRESHOLDS.LCP)}`}>
                    {formatTime(metrics.lcp)}
                  </div>
                  <div className="text-xs text-gray-400">Threshold: {PERFORMANCE_CONFIG.THRESHOLDS.LCP}ms</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500">FID (First Input Delay)</div>
                  <div className={`text-lg font-semibold ${getStatusColor(metrics.fid, PERFORMANCE_CONFIG.THRESHOLDS.FID)}`}>
                    {formatTime(metrics.fid)}
                  </div>
                  <div className="text-xs text-gray-400">Threshold: {PERFORMANCE_CONFIG.THRESHOLDS.FID}ms</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500">CLS (Cumulative Layout Shift)</div>
                  <div className={`text-lg font-semibold ${getStatusColor(metrics.cls, PERFORMANCE_CONFIG.THRESHOLDS.CLS)}`}>
                    {metrics.cls !== undefined ? metrics.cls.toFixed(3) : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400">Threshold: {PERFORMANCE_CONFIG.THRESHOLDS.CLS}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500">TTFB (Time to First Byte)</div>
                  <div className={`text-lg font-semibold ${getStatusColor(metrics.ttfb, PERFORMANCE_CONFIG.THRESHOLDS.TTFB)}`}>
                    {formatTime(metrics.ttfb)}
                  </div>
                  <div className="text-xs text-gray-400">Threshold: {PERFORMANCE_CONFIG.THRESHOLDS.TTFB}ms</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500">DOM Content Loaded</div>
                  <div className="text-lg font-semibold text-gray-700">
                    {formatTime(metrics.domContentLoaded)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Components Tab */}
          {activeTab === 'components' && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Component Render Times</h4>
              {metrics.componentRenderTime && Object.keys(metrics.componentRenderTime).length > 0 ? (
                <div className="overflow-y-auto max-h-60">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(metrics.componentRenderTime)
                        .sort((a, b) => b[1] - a[1]) // Sort by time (descending)
                        .map(([component, time], index) => (
                          <tr key={index} className={time > 50 ? 'bg-red-50' : ''}>
                            <td className="px-3 py-2 text-sm text-gray-900">{component}</td>
                            <td className={`px-3 py-2 text-sm text-right ${time > 50 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              {time.toFixed(2)}ms
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No component render data available</div>
              )}
            </div>
          )}

          {/* API Calls Tab */}
          {activeTab === 'api' && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">API Call Times</h4>
              {metrics.apiCallTime && Object.keys(metrics.apiCallTime).length > 0 ? (
                <div className="overflow-y-auto max-h-60">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Call</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(metrics.apiCallTime)
                        .sort((a, b) => b[1] - a[1]) // Sort by time (descending)
                        .map(([api, time], index) => (
                          <tr key={index} className={time > 500 ? 'bg-red-50' : ''}>
                            <td className="px-3 py-2 text-sm text-gray-900 truncate max-w-[200px]">{api}</td>
                            <td className={`px-3 py-2 text-sm text-right ${time > 500 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              {time.toFixed(2)}ms
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No API call data available</div>
              )}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Slow Resource Load Times (>500ms)</h4>
              {metrics.resourceLoadTime && Object.keys(metrics.resourceLoadTime).length > 0 ? (
                <div className="overflow-y-auto max-h-60">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(metrics.resourceLoadTime)
                        .filter(([_, time]) => time > 500) // Only show slow resources
                        .sort((a, b) => b[1] - a[1]) // Sort by time (descending)
                        .map(([resource, time], index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-900 truncate max-w-[200px]">{resource}</td>
                            <td className="px-3 py-2 text-sm text-right text-red-600 font-medium">
                              {time.toFixed(2)}ms
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No slow resource data available</div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={resetMetrics}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
            >
              Reset Metrics
            </button>
            <button
              onClick={logMetrics}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Log to Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Example usage:
 * 
 * // Add to your layout or specific pages where you want to monitor performance
 * <PerformanceDashboard />
 */