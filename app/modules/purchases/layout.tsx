import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { ModuleAccessGuard } from '@/components/module-access-guard';
import { PurchaseProvider } from '@/lib/purchase-state';

function PurchaseLoading() {
  return <div className="import-export-muted" style={{ padding: '24px 12px' }}>Loading purchases...</div>;
}

export default function PurchasesLayout({ children }: { children: ReactNode }) {
  return (
    <PurchaseProvider>
      <ModuleAccessGuard paths={['/modules/purchases', '/modules/purchases/suppliers']}>
        <Suspense fallback={<PurchaseLoading />}>{children}</Suspense>
      </ModuleAccessGuard>
    </PurchaseProvider>
  );
}
