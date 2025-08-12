'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-surface-900 border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-accent-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-lg md:text-xl font-semibold text-white truncate">
                <span className="hidden sm:inline">Clinic Front Desk</span>
                <span className="sm:hidden">Clinic</span>
              </h1>
            </div>
          </div>
          
          {/* Desktop User Info and Logout */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-white">{user.username}</p>
                    <p className="text-xs text-gray-400">Front Desk Staff</p>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-surface-800 desktop:hover:shadow-md"
              aria-label="Log out"
            >
              Log out
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-accent-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
          <div className="md:hidden border-t border-gray-700 py-3">
            <div className="flex flex-col space-y-3">
              {user && (
                <div className="flex items-center space-x-3 px-2">
                  <div className="w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user.username}</p>
                    <p className="text-xs text-gray-400">Front Desk Staff</p>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-surface-800 rounded-md transition-colors min-h-[44px]"
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
