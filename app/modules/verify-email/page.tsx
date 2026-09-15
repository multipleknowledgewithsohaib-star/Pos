import { Suspense } from 'react';
import { VerifyEmailForm } from '@/components/auth-flow';

export default function ModulesVerifyEmailPage() {
  return (
    <Suspense fallback={<main className="auth-standalone" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
