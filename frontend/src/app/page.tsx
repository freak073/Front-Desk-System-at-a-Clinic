"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-purple-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Large Gradient Orbs */}
        <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-2/3 right-1/6 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 left-1/2 w-72 h-72 bg-indigo-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

        {/* Floating Particles */}
        {mounted && (
          <div className="absolute inset-0">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-purple-400/30 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 6}s`,
                  animationDuration: `${5 + Math.random() * 4}s`
                }}
              ></div>
            ))}
          </div>
        )}

        {/* Diagonal Light Beams */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-bl from-purple-500/10 via-transparent to-transparent transform rotate-12 translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-tr from-violet-500/8 via-transparent to-transparent transform -rotate-12 -translate-x-1/4 translate-y-1/4"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            {/* Logo/Icon */}
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-purple-500/25 transform hover:scale-105 transition-transform duration-300">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>

            {/* Main Title */}
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-white via-purple-100 to-violet-200 bg-clip-text text-transparent leading-tight">
              Front Desk System
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-purple-200/80 mb-4 font-light">
              Welcome to the Clinic Front Desk Management System
            </p>

            {/* Description */}
            <p className="text-purple-300/60 mb-12 max-w-2xl mx-auto leading-relaxed">
              Streamline your clinic operations with our comprehensive front desk management solution.
              Handle appointments, manage patient queues, and coordinate with medical staff efficiently.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-transparent shadow-xl shadow-purple-500/20 min-w-[200px]"
              >
                <span className="flex items-center space-x-3">
                  <span>Login to Dashboard</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/0 via-white/10 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>

              {/* Secondary Button */}
              <button className="group inline-flex items-center justify-center px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-purple-200 font-medium rounded-2xl transition-all duration-300 backdrop-blur-sm hover:border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-w-[200px]">
                <span className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Learn More</span>
                </span>
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {/* Feature 1 */}
            <div className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Appointment Management</h3>
              <p className="text-purple-300/70 text-sm">Schedule and manage patient appointments with ease</p>
            </div>

            {/* Feature 2 */}
            <div className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Queue Management</h3>
              <p className="text-purple-300/70 text-sm">Efficiently manage patient queues and waiting times</p>
            </div>

            {/* Feature 3 */}
            <div className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Staff Coordination</h3>
              <p className="text-purple-300/70 text-sm">Coordinate with doctors and medical staff seamlessly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
    </div>
  );
}