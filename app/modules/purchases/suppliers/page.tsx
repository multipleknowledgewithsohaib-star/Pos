import { LayoutGrid } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { PurchasePageShell } from '@/components/purchase-section';
import { PurchaseSuppliersWorkspace } from '../_components/purchase-workspaces';

export default function PurchaseSuppliersPage() {
  return (
    <PurchasePageShell
      badge="16.14"
      eyebrow="SUPPLIER MANAGEMENT"
      title="Supplier Management"
      description="Manage your suppliers."
      backHref="/modules/purchases"
      action={
        <ButtonLink href="/modules/purchases/quick-actions" icon={LayoutGrid} variant="secondary">
          Quick Actions
        </ButtonLink>
      }
    >
      <PurchaseSuppliersWorkspace />
    </PurchasePageShell>
  );
}
