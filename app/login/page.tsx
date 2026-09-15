'use client';

import Link from 'next/link';
import { Mail, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { DEMO_CREDENTIALS } from '@/lib/auth-session';

function LoginForm() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get('error') === 'invalid';

  return (
    <main className="login-screen">
      <section className="login-card-next">
        <div className="login-logo">
          <Mail />
        </div>
        <h1>Welcome Back</h1>
        <form action="/api/demo-login" className="login-form-next" method="post">
          <input name="from" type="hidden" value="admin" />
          <label>
            <span className="sr-only">Email</span>
            <input
              autoComplete="email"
              defaultValue={DEMO_CREDENTIALS.admin.email}
              name="email"
              placeholder="Email"
              required
              type="email"
            />
          </label>
          <label>
            <span className="sr-only">Password</span>
            <input
              autoComplete="current-password"
              defaultValue={DEMO_CREDENTIALS.admin.password}
              name="password"
              placeholder="Password"
              required
              type="password"
            />
          </label>
          {hasError ? <p className="login-error" role="alert">Invalid email or password.</p> : null}
          <div className="login-options">
            <label>
              <input type="checkbox" />
              <span>Remember Me</span>
            </label>
            <Link href="/modules/login">Customer login</Link>
          </div>
          <button type="submit">Login</button>
          <p className="login-demo-copy">
            Admin: <strong>{DEMO_CREDENTIALS.admin.email}</strong> / <strong>{DEMO_CREDENTIALS.admin.password}</strong>
            <br />
            <Link href="/api/demo-login?role=admin&from=admin">Quick admin login</Link>
          </p>
        </form>
      </section>
      <Link className="login-admin-link" href="/modules/login">
        <ShieldCheck />
        Customer Modules
      </Link>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
