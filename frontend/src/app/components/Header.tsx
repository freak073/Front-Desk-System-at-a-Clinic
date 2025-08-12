'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-surface-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">Clinic Front Desk</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-white">{user.username}</p>
                    <p className="text-xs text-gray-400">Front Desk Staff</p>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-surface-800"
              aria-label="Log out"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
