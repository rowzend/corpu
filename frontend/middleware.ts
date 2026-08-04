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

  const protectedRoutes = ['/member'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = pathname.startsWith('/admin/') && pathname !== '/admin/login';

  const token = request.cookies.get('token')?.value;

  // Admin routes: require valid token AND admin role
  if (isAdminRoute) {
    if (!token || isTokenExpired(token)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Block member role from accessing admin routes
    const roleType = request.cookies.get('role_type')?.value;
    if (roleType === 'member') {
      return NextResponse.redirect(new URL('/member/dashboard', request.url));
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

    // Block admin role from accessing member routes
    const roleType = request.cookies.get('role_type')?.value;
    if (roleType === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  if (pathname === '/login') {
    if (token && !isTokenExpired(token)) {
      const activeGroupId = request.cookies.get('active_group_id')?.value;
      const roleType = request.cookies.get('role_type')?.value;
      if (activeGroupId) {
        const redirectUrl = roleType === 'member' ? '/member/dashboard' : '/admin/dashboard';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
    }
  }

  // Set default locale cookie if not present
  const response = NextResponse.next();
  const locale = request.cookies.get('NEXT_LOCALE')?.value;
  if (!locale || !['id', 'en', 'ar', 'zh', 'ja'].includes(locale)) {
    const acceptLang = request.headers.get('Accept-Language') || '';
    const preferred = acceptLang.split(',')[0]?.split('-')[0];
    const detected = preferred && ['id', 'en', 'ar', 'zh', 'ja'].includes(preferred) ? preferred : 'id';
    response.cookies.set('NEXT_LOCALE', detected, { path: '/', maxAge: 365 * 24 * 60 * 60 });
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/member/:path*',
    '/login',
  ]
};
