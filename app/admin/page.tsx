'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readAuthSession } from '@/lib/auth-session';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const session = readAuthSession();
    if (!session) {
      router.replace('/modules/login');
    } else if (session.role === 'admin') {
      router.replace('/dashboard'); // SaaS console dashboard
    } else {
      router.replace('/modules/dashboard'); // Customer dashboard
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', fontFamily: 'sans-serif', color: '#666' }}>
      <p>Redirecting to dashboard...</p>
    </div>
  );
}
