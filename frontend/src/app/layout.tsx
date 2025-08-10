import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Front Desk System',
  description: 'Clinic Front Desk Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Import AuthProvider here to wrap the app
  const AuthProvider = require('../context/AuthContext').AuthProvider;
  return (
    <html lang="en">
      <body className="bg-gray-900 min-h-screen text-gray-100">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}