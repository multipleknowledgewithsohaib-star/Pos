'use client';

import type { FormEvent, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { completeLogin, DEMO_CREDENTIALS, validateLogin } from '@/lib/auth-session';

const TWO_FACTOR_CODE = '123456';
const EMAIL_CODE = '654321';
const MODULE_AUTH_BASE = '/modules';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset' | 'verify' | 'two-factor';

type AuthInputProps = {
  icon: ReactNode;
  label: string;
  name: string;
  placeholder: string;
  type?: 'email' | 'password' | 'tel' | 'text';
  autoComplete?: string;
  required?: boolean;
};

export function LoginForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    const session = validateLogin(email, password);

    if (session) {
      setError('');
      completeLogin(session);
      return;
    }

    setLoading(false);
    setError('Invalid email or password. Demo credentials use karein.');
  }

  return (
    <main className="auth-login-screen">
      <section className="auth-shelf-panel" aria-label="Pharmacy illustration">
        <Image
          alt="Pharmacy shelves with medicine bottles"
          className="auth-shelf-image"
          fill
          priority
          sizes="330px"
          src="/auth/pharmacy-shelf.png"
        />
      </section>

      <section className="auth-brand-panel">
        <div className="auth-brand-mark">
          <span />
        </div>
        <h1>Solutionir pos</h1>
        <p>Sales, Inventory &amp; billing management</p>
        <p>Manage your inventory, sales, purchases and customers with ease.</p>
      </section>

      <section className="auth-form-panel auth-form-panel-login">
        <div className="auth-title-block auth-title-left">
          <h2>Welcome Back!</h2>
          <p>Login to your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <AuthInput
            autoComplete="email"
            icon={<Mail />}
            label="Email"
            name="email"
            placeholder="Enter your email"
            required
            type="email"
          />
          <AuthInput
            autoComplete="current-password"
            icon={<KeyRound />}
            label="Password"
            name="password"
            placeholder="Enter your password"
            required
            type="password"
          />
          {error ? <p className="auth-error">{error}</p> : null}
          <div className="auth-row-between">
            <label className="auth-check">
              <input name="remember" type="checkbox" />
              <span>Remember me</span>
            </label>
            <Link href={`${MODULE_AUTH_BASE}/forgot-password`}>Forgot Password?</Link>
          </div>
          <button className="auth-primary-button" disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-bottom-link">
          Don&apos;t have an account? <Link href={`${MODULE_AUTH_BASE}/signup`}>Sign up</Link>
        </p>
        <p className="auth-demo-note">
          Customer: <strong>{DEMO_CREDENTIALS.customer.email}</strong> / <strong>{DEMO_CREDENTIALS.customer.password}</strong>
          <br />
          Admin: <strong>{DEMO_CREDENTIALS.admin.email}</strong> / <strong>{DEMO_CREDENTIALS.admin.password}</strong>
        </p>
      </section>
    </main>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const agreed = form.get('terms') === 'on';
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const confirmPassword = String(form.get('confirmPassword') ?? '');

    if (!agreed) {
      setError('Terms & Conditions accept karna zaroori hai.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password aur confirm password match nahi kar rahe.');
      return;
    }

    setError('');
    router.push(`${MODULE_AUTH_BASE}/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <AuthStandaloneShell mode="signup">
      <AuthBackLink />
      <AuthIconTile icon={<UserPlus />} />
      <AuthTitle title="Create Account" subtitle="Fill in the details to create your Pharmacy account." />

      <form className="auth-form auth-form-wide" onSubmit={handleSubmit}>
        <AuthInput icon={<User />} label="Full Name" name="name" placeholder="Enter your full name" required />
        <AuthInput icon={<Mail />} label="Email" name="email" placeholder="Enter your email" required type="email" />
        <AuthInput icon={<Phone />} label="Phone" name="phone" placeholder="Enter your phone number" required type="tel" />

        <div className="auth-two-cols">
          <AuthInput icon={<KeyRound />} label="Password" name="password" placeholder="Create a password" required type="password" />
          <AuthInput
            icon={<LockKeyhole />}
            label="Confirm Password"
            name="confirmPassword"
            placeholder="Confirm your password"
            required
            type="password"
          />
        </div>

        <label className="auth-check auth-terms">
          <input name="terms" required type="checkbox" />
          <span>I agree to the <Link href={`${MODULE_AUTH_BASE}/signup`}>Terms & Conditions</Link></span>
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button className="auth-primary-button" type="submit">Sign Up</button>
      </form>

      <p className="auth-bottom-link">
        Already have an account? <Link href={`${MODULE_AUTH_BASE}/login`}>Login</Link>
      </p>
    </AuthStandaloneShell>
  );
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <AuthStandaloneShell mode="forgot">
      <AuthBackLink />
      <AuthIconTile icon={<LockKeyhole />} />
      <AuthTitle
        title="Forgot Password?"
        subtitle="Enter your email address and we'll send you a link to reset your password."
      />

      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthInput icon={<User />} label="Email" name="email" placeholder="Enter your email" required type="email" />
        {sent ? <p className="auth-success">Reset link sent. Demo ke liye reset screen open kar sakte hain.</p> : null}
        <button className="auth-primary-button" type="submit">Send Reset Link</button>
      </form>

      {sent ? (
        <button className="auth-text-button" onClick={() => router.push(`${MODULE_AUTH_BASE}/reset-password`)} type="button">
          Continue to Reset Password
        </button>
      ) : null}

      <p className="auth-bottom-link">
        Remember your password? <Link href={`${MODULE_AUTH_BASE}/login`}>Login</Link>
      </p>
    </AuthStandaloneShell>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirmPassword = String(form.get('confirmPassword') ?? '');

    if (password !== confirmPassword) {
      setError('New password aur confirm password match nahi kar rahe.');
      return;
    }

    setError('');
    router.push(`${MODULE_AUTH_BASE}/login`);
  }

  return (
    <AuthStandaloneShell mode="reset">
      <AuthBackLink />
      <AuthIconTile icon={<KeyRound />} />
      <AuthTitle title="Reset Password" subtitle="Create a new password for your account." />

      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthInput
          icon={<LockKeyhole />}
          label="New Password"
          name="password"
          placeholder="Enter new password"
          required
          type="password"
        />
        <AuthInput
          icon={<LockKeyhole />}
          label="Confirm Password"
          name="confirmPassword"
          placeholder="Confirm new password"
          required
          type="password"
        />
        {error ? <p className="auth-error">{error}</p> : null}
        <button className="auth-primary-button" type="submit">Reset Password</button>
      </form>
    </AuthStandaloneShell>
  );
}

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';
  const [error, setError] = useState('');

  function handleVerify(code: string) {
    if (code === EMAIL_CODE) {
      setError('');
      router.push(`${MODULE_AUTH_BASE}/login`);
      return;
    }

    setError('Invalid verification code. Demo code 654321 use karein.');
  }

  return (
    <AuthStandaloneShell mode="verify">
      <AuthBackLink />
      <AuthIconTile icon={<Mail />} />
      <AuthTitle title="Verify Email" subtitle={`Enter the 6-digit code sent to ${email}.`} />
      <OtpForm
        buttonLabel="Verify Email"
        error={error}
        helperText={`Demo email code: ${EMAIL_CODE}`}
        onVerify={handleVerify}
      />
      <p className="auth-bottom-link">
        Didn&apos;t receive code?{' '}
        <button
          className="auth-link-button"
          type="button"
          onClick={() => setError('Demo code resent. Use 654321.')}
        >
          Resend
        </button>
      </p>
    </AuthStandaloneShell>
  );
}

export function TwoFactorForm() {
  const router = useRouter();
  const [error, setError] = useState('');

  function handleVerify(code: string) {
    if (code === TWO_FACTOR_CODE) {
      setError('');
      completeLogin({
        email: DEMO_CREDENTIALS.admin.email,
        role: 'admin',
        loggedInAt: new Date().toISOString(),
      });
      return;
    }

    setError('Invalid code. Demo code 123456 use karein.');
  }

  return (
    <AuthStandaloneShell mode="two-factor">
      <AuthIconTile icon={<ShieldCheck />} />
      <AuthTitle title="Two-Factor Authentication" subtitle="Enter the 6-digit code from your authenticator app." />
      <OtpForm
        buttonLabel="Verify Code"
        error={error}
        helperText={`Demo 2FA code: ${TWO_FACTOR_CODE}`}
        onVerify={handleVerify}
        rememberLabel="Remember this device for 30 days"
      />
      <p className="auth-bottom-link">
        Can&apos;t access your device? <Link href={`${MODULE_AUTH_BASE}/verify-email`}>Use backup method</Link>
      </p>
    </AuthStandaloneShell>
  );
}

function AuthStandaloneShell({ children, mode }: { children: ReactNode; mode: AuthMode }) {
  return <main className={`auth-standalone auth-${mode}`}>{children}</main>;
}

function AuthBackLink() {
  return (
    <Link className="auth-back-link" href={`${MODULE_AUTH_BASE}/login`}>
      <ArrowLeft />
      <span>Back to login</span>
    </Link>
  );
}

function AuthIconTile({ icon }: { icon: ReactNode }) {
  return <div className="auth-icon-tile">{icon}</div>;
}

function AuthTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="auth-title-block">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

function AuthInput({
  autoComplete,
  icon,
  label,
  name,
  placeholder,
  required,
  type = 'text',
}: AuthInputProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && visible ? 'text' : type;

  return (
    <label className="auth-field">
      <span>{label}</span>
      <div className="auth-input-wrap">
        <i>{icon}</i>
        <input autoComplete={autoComplete} name={name} placeholder={placeholder} required={required} type={inputType} />
        {isPassword ? (
          <button
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="auth-eye-button"
            onClick={() => setVisible((current) => !current)}
            type="button"
          >
            {visible ? <EyeOff /> : <Eye />}
          </button>
        ) : null}
      </div>
    </label>
  );
}

function OtpForm({
  buttonLabel,
  error,
  helperText,
  onVerify,
  rememberLabel,
}: {
  buttonLabel: string;
  error: string;
  helperText: string;
  onVerify: (code: string) => void;
  rememberLabel?: string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = refs.current.map((input) => input?.value ?? '').join('');
    onVerify(code);
  }

  return (
    <form className="auth-form auth-otp-form" onSubmit={handleSubmit}>
      <div className="auth-otp-grid" aria-label="Verification code">
        {Array.from({ length: 6 }).map((_, index) => (
          <input
            aria-label={`Code digit ${index + 1}`}
            inputMode="numeric"
            key={index}
            maxLength={1}
            onChange={(event) => {
              event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '');
              if (event.currentTarget.value && index < 5) refs.current[index + 1]?.focus();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !event.currentTarget.value && index > 0) {
                refs.current[index - 1]?.focus();
              }
            }}
            ref={(node) => {
              refs.current[index] = node;
            }}
            required
            type="text"
          />
        ))}
      </div>

      {rememberLabel ? (
        <label className="auth-check auth-remember-device">
          <input name="rememberDevice" type="checkbox" />
          <span>{rememberLabel}</span>
        </label>
      ) : null}

      {error ? <p className="auth-error auth-otp-error">{error}</p> : null}
      <p className="auth-demo-note">{helperText}</p>
      <button className="auth-primary-button" type="submit">{buttonLabel}</button>
    </form>
  );
}
