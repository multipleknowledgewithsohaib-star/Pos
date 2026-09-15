import { Plus, ScanSearch } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { PurchasePageShell } from '@/components/purchase-section';
import { PurchaseOrderListWorkspace } from '../_components/purchase-workspaces';

export default function PurchaseOrderListPage() {
  return (
    <PurchasePageShell
      badge="16.2"
      eyebrow="PURCHASE ORDER LIST"
      title="Purchase Order List"
      description="View and manage all purchase orders."
      action={
        <>
          <ButtonLink href="/modules/purchases/ocr" icon={ScanSearch} variant="secondary">
            OCR Auto Fill
          </ButtonLink>
          <ButtonLink href="/modules/purchases/new" icon={Plus} variant="primary">
            New Purchase Order
          </ButtonLink>
        </>
      }
    >
      <PurchaseOrderListWorkspace />
    </PurchasePageShell>
  );
}
