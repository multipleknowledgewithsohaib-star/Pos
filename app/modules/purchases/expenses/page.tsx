import { Banknote } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { PurchasePageShell } from '@/components/purchase-section';
import { PurchaseExpensesWorkspace } from '../_components/purchase-workspaces';

export default function PurchaseExpensesPage() {
  return (
    <PurchasePageShell
      badge="16.9"
      eyebrow="PURCHASE EXPENSES"
      title="Purchase Expenses"
      description="Add other purchase related expenses."
      backHref="/modules/purchases"
      action={
        <ButtonLink href="/modules/purchases/quick-actions" icon={Banknote} variant="secondary">
          Quick Actions
        </ButtonLink>
      }
    >
      <PurchaseExpensesWorkspace />
    </PurchasePageShell>
  );
}
