import { PosProvider } from '@/lib/pos-state';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

function PosLoading() {
  return <div className="import-export-muted" style={{ padding: '24px 12px' }}>Loading POS...</div>;
}

export default function PosLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <PosProvider>
      <Suspense fallback={<PosLoading />}>{children}</Suspense>
    </PosProvider>
  );
}
