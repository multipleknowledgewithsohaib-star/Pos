import { Suspense } from 'react';
import { PurchasePageShell } from '@/components/purchase-section';
import { PurchaseReturnsWorkspace } from '../_components/purchase-workspaces';

export default function PurchaseReturnsPage() {
  return (
    <PurchasePageShell
      badge="16.13"
      eyebrow="PURCHASE RETURNS"
      title="Purchase Returns"
      description="Return items to a supplier."
      backHref="/modules/purchases/list"
    >
      <Suspense fallback={null}>
        <PurchaseReturnsWorkspace />
      </Suspense>
    </PurchasePageShell>
  );
}
