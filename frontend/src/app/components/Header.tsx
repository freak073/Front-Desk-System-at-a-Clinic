import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Clinic Logo" className="h-8 w-8" />
        <span className="font-bold text-lg text-gray-800">Clinic Front Desk</span>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-gray-600">Welcome, {user.username}</span>
        )}
        <button
          onClick={logout}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
