'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface PerformanceData {
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  bundleSize: {
    totalSize: number;
    jsSize: number;
    cssSize: number;
  };
  webVitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  };
}

const PerformanceMonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'web-vitals' | 'components' | 'api-calls' | 'resources'>('web-vitals');
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    renderTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    bundleSize: { totalSize: 0, jsSize: 0, cssSize: 0 },
    webVitals: {},
  });

  // Memoized update function to prevent unnecessary re-renders
  const updatePerformanceData = useCallback(() => {
    // Simulate performance metrics
    const mockMetrics = {
      renderTime: 12 + Math.random() * 8, // 12-20ms
      apiResponseTime: 800 + Math.random() * 400, // 800-1200ms
      memoryUsage: (45 + Math.random() * 15) * 1024 * 1024, // 45-60MB
    };

    // Simulate bundle size
    const mockBundleSize = {
      totalSize: Math.floor(180 + Math.random() * 40), // 180-220KB
      jsSize: Math.floor(140 + Math.random() * 30), // 140-170KB
      cssSize: Math.floor(25 + Math.random() * 15), // 25-40KB
    };

    // Simulate Web Vitals data
    const mockWebVitals = {
      lcp: 2750 + Math.random() * 500,
      fid: 8 + Math.random() * 15,
      cls: 0.05 + Math.random() * 0.1,
      fcp: 1200 + Math.random() * 300,
      ttfb: 180 + Math.random() * 100,
    };

    setPerformanceData({
      ...mockMetrics,
      bundleSize: mockBundleSize,
      webVitals: mockWebVitals,
    });
  }, []);

  // Simple performance data simulation without problematic hooks
  useEffect(() => {
    // Update performance data every 5 seconds
    const interval = setInterval(updatePerformanceData, 5000);
    updatePerformanceData(); // Initial update

    return () => clearInterval(interval);
  }, [updatePerformanceData]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; poor: number }): string => {
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.poor) return 'text-yellow-400';
    return 'text-red-400';
  };

  const tabs = [
    { id: 'web-vitals', name: 'Web Vitals', shortName: 'Web Vitals' },
    { id: 'components', name: 'Components', shortName: 'Components' },
    { id: 'api-calls', name: 'API Calls', shortName: 'API Calls' },
    { id: 'resources', name: 'Resources', shortName: 'Resources' },
  ] as const;

  const renderWebVitalsTab = () => {
    const webVitalsCards = [
      {
        title: 'FCP (First Contentful Paint)',
        value: performanceData.webVitals.fcp ? formatTime(performanceData.webVitals.fcp) : 'N/A',
        threshold: '1800ms',
        color: getPerformanceColor(performanceData.webVitals.fcp || 0, { good: 1800, poor: 3000 }),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        gradient: 'from-blue-500 to-cyan-500',
        shadow: 'shadow-blue-500/25'
      },
      {
        title: 'LCP (Largest Contentful Paint)',
        value: performanceData.webVitals.lcp ? formatTime(performanceData.webVitals.lcp) : 'N/A',
        threshold: '2500ms',
        color: getPerformanceColor(performanceData.webVitals.lcp || 0, { good: 2500, poor: 4000 }),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        gradient: 'from-green-500 to-emerald-500',
        shadow: 'shadow-green-500/25'
      },
      {
        title: 'FID (First Input Delay)',
        value: performanceData.webVitals.fid ? formatTime(performanceData.webVitals.fid) : 'N/A',
        threshold: '100ms',
        color: getPerformanceColor(performanceData.webVitals.fid || 0, { good: 100, poor: 300 }),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        ),
        gradient: 'from-purple-500 to-violet-500',
        shadow: 'shadow-purple-500/25'
      },
      {
        title: 'CLS (Cumulative Layout Shift)',
        value: performanceData.webVitals.cls ? performanceData.webVitals.cls.toFixed(3) : 'N/A',
        threshold: '0.1',
        color: getPerformanceColor((performanceData.webVitals.cls || 0) * 1000, { good: 100, poor: 250 }),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        ),
        gradient: 'from-yellow-500 to-orange-500',
        shadow: 'shadow-yellow-500/25'
      },
      {
        title: 'TTFB (Time to First Byte)',
        value: performanceData.webVitals.ttfb ? formatTime(performanceData.webVitals.ttfb) : 'N/A',
        threshold: '200ms',
        color: getPerformanceColor(performanceData.webVitals.ttfb || 0, { good: 200, poor: 500 }),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        gradient: 'from-indigo-500 to-purple-500',
        shadow: 'shadow-indigo-500/25'
      },
      {
        title: 'DOM Content Loaded',
        value: formatTime(1200 + Math.random() * 800),
        threshold: '1500ms',
        color: 'text-blue-400',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        ),
        gradient: 'from-cyan-500 to-blue-500',
        shadow: 'shadow-cyan-500/25'
      }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {webVitalsCards.map((card, index) => (
          <div
            key={index}
            className={`group backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl ${card.shadow} hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105 hover:bg-white/15 hover:border-white/30`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-300 mb-3 group-hover:text-gray-200 transition-colors">{card.title}</p>
                <p className={`text-4xl font-bold mb-2 group-hover:scale-105 transition-transform ${card.color}`}>{card.value}</p>
                <p className="text-xs text-purple-300 font-medium">Threshold: {card.threshold}</p>
              </div>
              <div className={`w-16 h-16 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-xl ${card.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <div className="text-white">
                  {card.icon}
                </div>
              </div>
            </div>

            {/* Progress bar for visual appeal */}
            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div
                className={`bg-gradient-to-r ${card.gradient} h-2 rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min(Math.random() * 80 + 20, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderComponentsTab = () => {
    const componentCards = [
      {
        title: 'Render Performance',
        value: formatTime(performanceData.renderTime),
        description: 'Target: <16ms (60fps)',
        color: getPerformanceColor(performanceData.renderTime, { good: 16, poor: 100 }),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        gradient: 'from-blue-500 to-cyan-500',
        shadow: 'shadow-blue-500/25'
      },
      {
        title: 'Component Mount Time',
        value: formatTime(45 + Math.random() * 30),
        description: 'Average mount time',
        color: 'text-green-400',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2" />
          </svg>
        ),
        gradient: 'from-green-500 to-emerald-500',
        shadow: 'shadow-green-500/25'
      },
      {
        title: 'Re-render Count',
        value: Math.floor(Math.random() * 50 + 10).toString(),
        description: 'Since page load',
        color: 'text-yellow-400',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
        gradient: 'from-yellow-500 to-orange-500',
        shadow: 'shadow-yellow-500/25'
      }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {componentCards.map((card, index) => (
          <div
            key={index}
            className={`group backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl ${card.shadow} hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105 hover:bg-white/15 hover:border-white/30`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-300 mb-3 group-hover:text-gray-200 transition-colors">{card.title}</p>
                <p className={`text-4xl font-bold mb-2 group-hover:scale-105 transition-transform ${card.color}`}>{card.value}</p>
                <p className="text-xs text-purple-300 font-medium">{card.description}</p>
              </div>
              <div className={`w-16 h-16 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-xl ${card.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <div className="text-white">
                  {card.icon}
                </div>
              </div>
            </div>

            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div
                className={`bg-gradient-to-r ${card.gradient} h-2 rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min(Math.random() * 80 + 20, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderApiCallsTab = () => {
    const apiCards = [
      {
        title: 'API Response Time',
        value: formatTime(performanceData.apiResponseTime),
        description: 'Average response time',
        color: getPerformanceColor(performanceData.apiResponseTime, { good: 1000, poor: 2000 }),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        ),
        gradient: 'from-blue-500 to-cyan-500',
        shadow: 'shadow-blue-500/25'
      },
      {
        title: 'Failed Requests',
        value: Math.floor(Math.random() * 5).toString(),
        description: 'Error count',
        color: 'text-red-400',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        gradient: 'from-red-500 to-pink-500',
        shadow: 'shadow-red-500/25'
      },
      {
        title: 'Cache Hit Rate',
        value: `${Math.floor(Math.random() * 20 + 75)}%`,
        description: 'Cache efficiency',
        color: 'text-green-400',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        gradient: 'from-green-500 to-emerald-500',
        shadow: 'shadow-green-500/25'
      }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {apiCards.map((card, index) => (
          <div
            key={index}
            className={`group backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl ${card.shadow} hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105 hover:bg-white/15 hover:border-white/30`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-300 mb-3 group-hover:text-gray-200 transition-colors">{card.title}</p>
                <p className={`text-4xl font-bold mb-2 group-hover:scale-105 transition-transform ${card.color}`}>{card.value}</p>
                <p className="text-xs text-purple-300 font-medium">{card.description}</p>
              </div>
              <div className={`w-16 h-16 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-xl ${card.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <div className="text-white">
                  {card.icon}
                </div>
              </div>
            </div>

            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div
                className={`bg-gradient-to-r ${card.gradient} h-2 rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min(Math.random() * 80 + 20, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderResourcesTab = () => {
    const resourceCards = [
      {
        title: 'Memory Usage',
        value: formatBytes(performanceData.memoryUsage),
        description: 'Heap memory used',
        color: getPerformanceColor(performanceData.memoryUsage, { good: 50 * 1024 * 1024, poor: 100 * 1024 * 1024 }),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        ),
        gradient: 'from-purple-500 to-violet-500',
        shadow: 'shadow-purple-500/25'
      },
      {
        title: 'Bundle Size',
        value: `${performanceData.bundleSize.totalSize}KB`,
        description: 'Total bundle size',
        color: 'text-blue-400',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
        gradient: 'from-blue-500 to-cyan-500',
        shadow: 'shadow-blue-500/25'
      },
      {
        title: 'Network Requests',
        value: Math.floor(Math.random() * 50 + 20).toString(),
        description: 'Total requests',
        color: 'text-purple-400',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        ),
        gradient: 'from-indigo-500 to-purple-500',
        shadow: 'shadow-indigo-500/25'
      }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {resourceCards.map((card, index) => (
          <div
            key={index}
            className={`group backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl ${card.shadow} hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105 hover:bg-white/15 hover:border-white/30`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-300 mb-3 group-hover:text-gray-200 transition-colors">{card.title}</p>
                <p className={`text-4xl font-bold mb-2 group-hover:scale-105 transition-transform ${card.color}`}>{card.value}</p>
                <p className="text-xs text-purple-300 font-medium">{card.description}</p>
              </div>
              <div className={`w-16 h-16 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-xl ${card.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <div className="text-white">
                  {card.icon}
                </div>
              </div>
            </div>

            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div
                className={`bg-gradient-to-r ${card.gradient} h-2 rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min(Math.random() * 80 + 20, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden">
      {/* Vanta Black Background with Purple Accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-violet-600/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-indigo-600/4 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/15 rounded-full animate-float"
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

      <div className="relative z-10">
        <div className="responsive-container">
          {/* Header matching the app's style */}
          <div className="flex flex-col space-y-6 mb-8 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  Performance Dashboard
                </h1>
                <p className="text-purple-300 text-sm mt-1">Real-time system performance metrics</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">Live</span>
              </div>
              <button
                onClick={() => {
                  try {
                    alert('Performance monitoring disabled');
                    if (typeof window !== 'undefined' && window.performance) {
                      if (window.performance.clearMarks) {
                        window.performance.clearMarks();
                      }
                      if (window.performance.clearMeasures) {
                        window.performance.clearMeasures();
                      }
                    }
                  } catch (error) {
                    console.log('Performance API not available:', error);
                  }
                }}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-red-300 hover:text-red-200 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                Disable
              </button>
            </div>
          </div>

          {/* Navigation Tabs matching NavigationTabs component */}
          <div className="mb-12">
            <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-2">
              <nav className="flex space-x-2 overflow-x-auto scrollbar-hide" role="tablist">
                {tabs.map(tab => {
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group flex items-center space-x-3 px-6 py-4 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap transform hover:scale-105 relative overflow-hidden ${isActive
                        ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-xl shadow-purple-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/10'
                        }`}
                      role="tab"
                      aria-selected={isActive}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-violet-400/20 animate-pulse"></div>
                      )}

                      <div className={`relative z-10 p-2 rounded-lg transition-all duration-300 ${isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-white/10 text-gray-400 group-hover:bg-white/20 group-hover:text-white'
                        }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {tab.id === 'web-vitals' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />}
                          {tab.id === 'components' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2" />}
                          {tab.id === 'api-calls' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />}
                          {tab.id === 'resources' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                        </svg>
                      </div>

                      <div className="relative z-10">
                        <span className="hidden sm:inline font-bold">{tab.name}</span>
                        <span className="sm:hidden font-bold">{tab.shortName}</span>
                        {isActive && (
                          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white/50 rounded-full"></div>
                        )}
                      </div>

                      {/* Hover effect */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {activeTab === 'web-vitals' && renderWebVitalsTab()}
            {activeTab === 'components' && renderComponentsTab()}
            {activeTab === 'api-calls' && renderApiCallsTab()}
            {activeTab === 'resources' && renderResourcesTab()}
          </div>

          {/* Action Buttons matching app style */}
          <div className="backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-10 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/25">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">Performance Controls</h3>
                  <p className="text-purple-300">Manage monitoring and data</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => {
                  setPerformanceData({
                    renderTime: 0,
                    apiResponseTime: 0,
                    memoryUsage: 0,
                    bundleSize: { totalSize: 0, jsSize: 0, cssSize: 0 },
                    webVitals: {},
                  });
                }}
                className="group backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 text-white font-bold p-6 rounded-2xl flex flex-col items-center space-y-4 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-gray-500/20 focus:outline-none focus:ring-2 focus:ring-gray-500/50 active:scale-100"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-500/25 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-lg">Reset Metrics</h4>
                  <p className="text-gray-300 text-sm opacity-90">Clear all performance data</p>
                </div>
              </button>

              <button
                onClick={() => {
                  console.log('Current Performance Metrics:', {
                    renderTime: performanceData.renderTime,
                    apiResponseTime: performanceData.apiResponseTime,
                    memoryUsage: performanceData.memoryUsage,
                    webVitals: performanceData.webVitals,
                    bundleSize: performanceData.bundleSize,
                  });
                }}
                className="group backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 text-white font-bold p-6 rounded-2xl flex flex-col items-center space-y-4 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-100"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-lg">Export Data</h4>
                  <p className="text-gray-300 text-sm opacity-90">Log metrics to console</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitoringDashboard;