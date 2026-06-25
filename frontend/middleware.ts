import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return Date.now() >= payload.exp * 1000;
}

function isSudoSessionValid(sudoCookie: string | undefined): boolean {
  if (!sudoCookie) return false;
  try {
    const decoded = atob(sudoCookie);
    const session = JSON.parse(decoded);
    return session.expires_at && Date.now() < session.expires_at;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/dashboard', '/users', '/roles', '/settings', '/knowledge', '/profile', '/member'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isSudoRoute = pathname.startsWith('/sudo/') && pathname !== '/sudo/login';

  const token = request.cookies.get('token')?.value;

  // Sudo routes: require valid token + valid sudo session
  if (isSudoRoute) {
    if (!token || isTokenExpired(token)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isSudoSessionValid(request.cookies.get('sudo_session')?.value)) {
      return NextResponse.redirect(new URL('/sudo/login', request.url));
    }
  }

  // Protected routes (non-sudo)
  if (isProtectedRoute) {
    if (!token || isTokenExpired(token)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      if (token) loginUrl.searchParams.set('reason', 'token_expired');
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === '/login') {
    if (token && !isTokenExpired(token)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
    '/roles/:path*',
    '/settings/:path*',
    '/knowledge/:path*',
    '/profile/:path*',
    '/sudo/:path*',
    '/member/:path*',
    '/login',
  ]
};
