import { Suspense } from 'react';
import { ModuleLogin } from '@/components/module-login';

function LoginFallback() {
  return <main className="module-login-screen" style={{ minHeight: '100dvh' }} />;
}

export default function ModulesLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <ModuleLogin />
    </Suspense>
  );
}
