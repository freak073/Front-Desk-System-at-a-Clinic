import type { Metadata } from 'next';
import './globals.css';
import AppShell from './AppShell';

export const metadata: Metadata = {
  title: 'Front Desk System',
  description: 'Clinic Front Desk Management System',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-900 min-h-screen text-gray-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}