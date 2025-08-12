'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="backdrop-blur-xl bg-black/50 border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:py-5">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                <span className="hidden sm:inline">Clinic Front Desk</span>
                <span className="sm:hidden">Clinic</span>
              </h1>
            </div>
          </div>
          
          {/* Desktop User Info and Logout */}
          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <span className="text-sm font-semibold text-white">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-semibold text-white">{user.username}</p>
                    <p className="text-xs text-purple-300">Front Desk Staff</p>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-all duration-200 rounded-xl hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20"
              aria-label="Log out"
            >
              Log out
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-w-[44px] min-h-[44px] flex items-center justify-center backdrop-blur-sm border border-white/10"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="flex flex-col space-y-4">
              {user && (
                <div className="flex items-center space-x-4 px-3 py-2 rounded-xl bg-white/5">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <span className="text-sm font-semibold text-white">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user.username}</p>
                    <p className="text-xs text-purple-300">Front Desk Staff</p>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center px-3 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 min-h-[44px] backdrop-blur-sm border border-white/10"
                aria-label="Log out"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
