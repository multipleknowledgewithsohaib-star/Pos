import { Suspense } from 'react';
import { VerifyEmailForm } from '@/components/auth-flow';

export default function ModulesEmailVerificationPage() {
  return (
    <Suspense fallback={<main className="auth-standalone" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
