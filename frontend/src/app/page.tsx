import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="card max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Front Desk System
        </h1>
        <p className="text-gray-400 mb-8">
          Welcome to the Clinic Front Desk Management System
        </p>
        <Link
          href="/login"
          className="btn-primary inline-block"
        >
          Login to Dashboard
        </Link>
      </div>
    </div>
  );
}