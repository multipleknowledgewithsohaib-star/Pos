import { Suspense } from 'react';
import { ListOrdered, ScanSearch } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { PurchasePageShell } from '@/components/purchase-section';
import { PurchaseNewOrderWorkspace } from '../_components/purchase-workspaces';

export default function PurchaseNewOrderPage() {
  return (
    <PurchasePageShell
      badge="16.3"
      eyebrow="NEW PURCHASE ORDER"
      title="New Purchase Order"
      description="Create a new purchase order."
      backHref="/modules/purchases/list"
      action={
        <>
          <ButtonLink href="/modules/purchases/ocr" icon={ScanSearch} variant="secondary">
            OCR Auto Fill
          </ButtonLink>
          <ButtonLink href="/modules/purchases/list" icon={ListOrdered} variant="secondary">
            Order List
          </ButtonLink>
        </>
      }
    >
      <Suspense fallback={null}>
        <PurchaseNewOrderWorkspace />
      </Suspense>
    </PurchasePageShell>
  );
}
