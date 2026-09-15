export const AUTH_SESSION_KEY = 'pharma-auth-session-v1';
export const AUTH_COOKIE_NAME = 'pharma-auth-session-v1';

export type AuthRole = 'admin' | 'manager' | 'salesman' | 'inventory_user' | 'customer';

export type AuthSession = {
  email: string;
  role: AuthRole;
  loggedInAt: string;
};

const ADMIN_EMAIL = 'admin@coresaas.com';
const MANAGER_EMAIL = 'manager@coresaas.com';
const SALESMAN_EMAIL = 'salesman@coresaas.com';
const INVENTORY_EMAIL = 'inventory@coresaas.com';
const CUSTOMER_EMAIL = 'customer@pharmacy.com';

const DEFAULT_PASSWORD = 'password123';
const ADMIN_PASSWORD = 'admin123';
const CUSTOMER_PASSWORD = 'customer123';

export function validateLogin(email: string, password: string): AuthSession | null {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (normalizedEmail === ADMIN_EMAIL && normalizedPassword === ADMIN_PASSWORD) {
    return { email: normalizedEmail, role: 'admin', loggedInAt: new Date().toISOString() };
  }

  if (normalizedEmail === MANAGER_EMAIL && normalizedPassword === DEFAULT_PASSWORD) {
    return { email: normalizedEmail, role: 'manager', loggedInAt: new Date().toISOString() };
  }

  if (normalizedEmail === SALESMAN_EMAIL && normalizedPassword === DEFAULT_PASSWORD) {
    return { email: normalizedEmail, role: 'salesman', loggedInAt: new Date().toISOString() };
  }

  if (normalizedEmail === INVENTORY_EMAIL && normalizedPassword === DEFAULT_PASSWORD) {
    return { email: normalizedEmail, role: 'inventory_user', loggedInAt: new Date().toISOString() };
  }

  if (normalizedEmail === CUSTOMER_EMAIL && normalizedPassword === CUSTOMER_PASSWORD) {
    return { email: normalizedEmail, role: 'customer', loggedInAt: new Date().toISOString() };
  }

  return null;
}

export function getPostLoginPath(role: AuthRole) {
  // admin routes to the console dashboard, module users route to the module dashboard
  // wait, the prompt specified "Lag alag emails banou module main admin ki alag manager ki alag"
  // So all of these users might want to go to /modules/dashboard, except the SaaS admin?
  // Let's assume all of these demo accounts access the module shell directly.
  return role === 'admin' ? '/modules/dashboard' : '/modules/dashboard';
}

export function setAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

/** Full page navigation — works reliably on LAN / mobile browsers. */
export function completeLogin(session: AuthSession) {
  setAuthSession(session);
  const path = getPostLoginPath(session.role);

  if (typeof window !== 'undefined') {
    window.location.assign(path);
  }

  return path;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
  return null;
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    let raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      const cookieVal = getCookie(AUTH_COOKIE_NAME);
      if (cookieVal) {
        const decoded = decodeURIComponent(cookieVal);
        window.localStorage.setItem(AUTH_SESSION_KEY, decoded);
        raw = decoded;
      }
    }

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

export const DEMO_CREDENTIALS = {
  admin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  manager: { email: MANAGER_EMAIL, password: DEFAULT_PASSWORD },
  salesman: { email: SALESMAN_EMAIL, password: DEFAULT_PASSWORD },
  inventory: { email: INVENTORY_EMAIL, password: DEFAULT_PASSWORD },
  customer: { email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD },
} as const;
