"use client";
import React from 'react';
import Providers from './providers';
import { AuthProvider } from '../context/AuthContext';
import { GlobalStateProvider } from '../context/GlobalStateContext';
import MobileNav from './components/MobileNav';

interface AppShellProps { children: React.ReactNode; }

const AppShell: React.FC<Readonly<AppShellProps>> = ({ children }) => {
  return (
    <Providers>
      <AuthProvider>
        <GlobalStateProvider>
          <div className="pb-16">{children}</div>
          <MobileNav />
        </GlobalStateProvider>
      </AuthProvider>
    </Providers>
  );
};

export default AppShell;
