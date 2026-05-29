import { NextRequest, NextResponse } from 'next/server';

// Routes that need authentication
const PROTECTED_PREFIXES = ['/dashboard', '/admin'];
// Routes only for guests (redirect to dashboard if logged in)
const GUEST_ONLY = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth cookie (set by client auth.ts on login)
  const token = request.cookies.get('aic_token')?.value;
  const role  = request.cookies.get('aic_role')?.value;

  const isAuthenticated = !!token;
  const isAdminUser     = role === 'admin';

  // ── Protect dashboard & admin ──────────────────────────
  const needsAuth = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  if (needsAuth && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin-only routes ──────────────────────────────────
  if (pathname.startsWith('/admin') && !isAdminUser) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── Redirect logged-in users away from auth pages ──────
  const isGuestOnly = GUEST_ONLY.some(p => pathname.startsWith(p));
  if (isGuestOnly && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
