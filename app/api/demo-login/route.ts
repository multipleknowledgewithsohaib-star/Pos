import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  getPostLoginPath,
  validateLogin,
  type AuthRole,
  type AuthSession,
} from '@/lib/auth-session';
import { readAdminData } from '@/lib/admin-store';

function requestOrigin(request: Request) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') ?? 'http';
  if (host) {
    return `${protocol}://${host}`;
  }

  return new URL(request.url).origin;
}

function redirectWithSession(session: AuthSession, request: Request, from?: string) {
  let path = getPostLoginPath(session.role);
  if (from === 'admin' && session.role === 'admin') {
    path = '/dashboard';
  }
  const target = new URL(path, requestOrigin(request));
  const response = NextResponse.redirect(target, 303);
  response.cookies.set(AUTH_COOKIE_NAME, JSON.stringify(session), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    httpOnly: false,
  });
  return response;
}

function redirectWithError(request: Request, from: 'modules' | 'admin') {
  const loginPath = from === 'admin' ? '/login' : '/modules/login';
  const target = new URL(loginPath, requestOrigin(request));
  target.searchParams.set('error', 'invalid');
  return NextResponse.redirect(target, 303);
}

/** Map a freeform role string (from console) to a valid AuthRole. */
function mapConsoleRole(role: string): AuthRole {
  const normalized = role.trim().toLowerCase();
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('manager')) return 'manager';
  if (normalized.includes('inventory') || normalized.includes('store')) return 'inventory_user';
  return 'salesman';
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const from = String(formData.get('from') ?? 'modules') === 'admin' ? 'admin' : 'modules';

  // First try the built-in demo credentials
  let session = validateLogin(email, password);

  // If not found, check admin-console.json users
  if (!session) {
    try {
      const adminData = await readAdminData();
      const normalizedEmail = email.trim().toLowerCase();
      const consoleUser = adminData.users.find(
        (u) =>
          u.email.trim().toLowerCase() === normalizedEmail &&
          u.status === 'Active' &&
          u.password === password,
      );
      if (consoleUser) {
        session = {
          email: normalizedEmail,
          role: mapConsoleRole(consoleUser.role),
          loggedInAt: new Date().toISOString(),
        };
      }
    } catch {
      // admin-store read failure — fall through to error
    }
  }

  if (!session) {
    return redirectWithError(request, from);
  }

  return redirectWithSession(session, request, from);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get('role');
  const from = url.searchParams.get('from') ?? 'modules';

  if (role === 'customer') {
    return redirectWithSession(
      { email: 'customer@pharmacy.com', role: 'customer', loggedInAt: new Date().toISOString() },
      request,
      from,
    );
  }

  if (role === 'admin') {
    return redirectWithSession(
      { email: 'admin@coresaas.com', role: 'admin', loggedInAt: new Date().toISOString() },
      request,
      from,
    );
  }

  if (role === 'manager') {
    return redirectWithSession(
      { email: 'manager@coresaas.com', role: 'manager', loggedInAt: new Date().toISOString() },
      request,
      from,
    );
  }

  if (role === 'salesman') {
    return redirectWithSession(
      { email: 'salesman@coresaas.com', role: 'salesman', loggedInAt: new Date().toISOString() },
      request,
      from,
    );
  }

  if (role === 'inventory') {
    return redirectWithSession(
      { email: 'inventory@coresaas.com', role: 'inventory_user', loggedInAt: new Date().toISOString() },
      request,
      from,
    );
  }

  return redirectWithError(request, 'modules');
}
