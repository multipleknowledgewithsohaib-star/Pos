'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { DEMO_CREDENTIALS } from '@/lib/auth-session';

export function ModuleLogin() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get('error') === 'invalid';
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="module-login-screen">
      <section className="module-login-visual" aria-label="Pharmacy illustration">
        <Image
          alt="Pharmacy shelves"
          className="module-login-visual-image"
          fill
          priority
          sizes="330px"
          src="/auth/pharmacy-shelf.png"
        />
      </section>

      <section className="module-login-brand">
        <div className="module-brand-icon-wrap">
          <Image
            src="/solutionir-icon.png"
            alt="SolutionIR Logo"
            width={110}
            height={110}
            priority
            className="module-brand-icon-img"
          />
        </div>
        <h1>
          <span className="brand-name-solution">SolutionIR</span>{' '}
          <span className="brand-name-pos">POS</span>
        </h1>
        <p className="module-brand-tagline">Sales, Inventory, Billing &amp; Customer Management</p>
        <p className="module-brand-desc">Streamline sales, inventory, billing, purchases and customer management from a single platform.</p>
      </section>

      <section className="module-login-card">
        <div className="module-login-title">
          <h2>Welcome Back!</h2>
          <p>Login to your account</p>
        </div>

        <form action="/api/demo-login" className="module-login-form" method="post">
          <input name="from" type="hidden" value="modules" />

          <label>
            <span>Email</span>
            <div className="module-input">
              <Mail />
              <input
                autoComplete="email"
                defaultValue={DEMO_CREDENTIALS.customer.email}
                name="email"
                placeholder="Enter your email"
                required
                type="email"
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="module-input">
              <KeyRound />
              <input
                autoComplete="current-password"
                defaultValue={DEMO_CREDENTIALS.customer.password}
                name="password"
                placeholder="Enter your password"
                required
                type={showPassword ? 'text' : 'password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#64748b',
                }}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </label>

          {hasError ? (
            <p className="module-auth-error" role="alert">
              Invalid email or password. Demo credentials neeche dekhein ya Quick Login use karein.
            </p>
          ) : null}

          <div className="module-login-row">
            <label>
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <Link href="/modules/forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit">Sign In</button>
        </form>

        <div className="module-login-quick" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a className="module-login-quick-button" href="/api/demo-login?role=admin" style={{ flex: '1 1 45%', fontSize: '0.8rem', padding: '0.5rem' }}>
            Login as Admin
          </a>
          <a className="module-login-quick-button" href="/api/demo-login?role=manager" style={{ flex: '1 1 45%', fontSize: '0.8rem', padding: '0.5rem' }}>
            Login as Manager
          </a>
          <a className="module-login-quick-button" href="/api/demo-login?role=salesman" style={{ flex: '1 1 45%', fontSize: '0.8rem', padding: '0.5rem' }}>
            Login as Salesman
          </a>
          <a className="module-login-quick-button" href="/api/demo-login?role=inventory" style={{ flex: '1 1 45%', fontSize: '0.8rem', padding: '0.5rem' }}>
            Login as Inventory
          </a>
        </div>

        <p className="module-login-link">
          Don&apos;t have an account? <Link href="/modules/signup">Sign up</Link>
        </p>
        <div className="module-demo-copy" style={{ textAlign: 'left', fontSize: '0.85rem' }}>
          <strong>Admin:</strong> {DEMO_CREDENTIALS.admin.email} / {DEMO_CREDENTIALS.admin.password}
          <br />
          <strong>Manager:</strong> {DEMO_CREDENTIALS.manager.email} / {DEMO_CREDENTIALS.manager.password}
          <br />
          <strong>Salesman:</strong> {DEMO_CREDENTIALS.salesman.email} / {DEMO_CREDENTIALS.salesman.password}
          <br />
          <strong>Inventory:</strong> {DEMO_CREDENTIALS.inventory.email} / {DEMO_CREDENTIALS.inventory.password}
        </div>
      </section>
    </main>
  );
}
