import { Suspense } from 'react';
import { PurchasePageShell } from '@/components/purchase-section';
import { PurchaseReceiveWorkspace } from '../_components/purchase-workspaces';

export default function PurchaseReceivePage() {
  return (
    <PurchasePageShell
      badge="16.11"
      eyebrow="RECEIVE PURCHASE"
      title="Receive Purchase"
      description="Receive items against a purchase order."
      backHref="/modules/purchases/list"
    >
      <Suspense fallback={null}>
        <PurchaseReceiveWorkspace />
      </Suspense>
    </PurchasePageShell>
  );
}
