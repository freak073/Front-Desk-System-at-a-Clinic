import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-800 shadow-lg flex items-center justify-between px-6 py-4 border-b border-gray-700">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Clinic Logo" className="h-8 w-8" />
        <span className="font-bold text-xl text-white">Clinic Front Desk</span>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-gray-300">Welcome, <span className="font-semibold text-white">{user.username}</span></span>
        )}
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition shadow-md hover:shadow-lg"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
