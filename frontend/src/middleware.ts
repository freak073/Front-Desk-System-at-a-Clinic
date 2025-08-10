import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');
  const isLoginPage = request.nextUrl.pathname === '/login';
  const { pathname } = request.nextUrl;

  // Always allow static files and api routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // If trying to access login page while already authenticated
  if (isLoginPage && authToken) {
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If trying to access protected routes without authentication
  if (!isLoginPage && !authToken) {
    const redirectUrl = new URL('/login', request.url);
    // Store the attempted URL to redirect back after login
    redirectUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'same-origin');

  return response;
}

export const config = {
  matcher: ['/login', '/dashboard/:path*']
};
