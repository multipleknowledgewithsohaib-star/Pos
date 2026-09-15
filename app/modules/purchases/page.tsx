import { LayoutGrid, Plus, ScanSearch } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { PurchasePageShell } from '@/components/purchase-section';
import { PurchaseDashboardWorkspace } from './_components/purchase-workspaces';

export default function PurchasesDashboardPage() {
  return (
    <PurchasePageShell
      badge="16.1"
      eyebrow="PURCHASE DASHBOARD"
      title="Purchase Dashboard"
      description="Overview of purchase activities."
      action={
        <>
          <ButtonLink href="/modules/purchases/quick-actions" icon={LayoutGrid} variant="secondary">
            Quick Actions
          </ButtonLink>
          <ButtonLink href="/modules/purchases/ocr" icon={ScanSearch} variant="secondary">
            OCR Auto Fill
          </ButtonLink>
          <ButtonLink href="/modules/purchases/new" icon={Plus} variant="primary">
            New Purchase Order
          </ButtonLink>
        </>
      }
    >
      <PurchaseDashboardWorkspace />
    </PurchasePageShell>
  );
}
