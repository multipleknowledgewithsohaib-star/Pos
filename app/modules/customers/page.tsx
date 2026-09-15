import { Plus, UserRound } from 'lucide-react';
import { ModuleShell } from '@/components/module-shell';
import { SectionHero } from '@/components/section-hero';
import { ButtonLink } from '@/components/ui';
import { CustomerManagementWorkspace } from './_components/customer-workspaces';

export default function CustomersPage() {
  return (
    <ModuleShell active="Customers">
      <div className="purchase-page">
        <SectionHero
          badge="16.16"
          eyebrow="CUSTOMER MANAGEMENT"
          title="Customer Management"
          description="Add, edit and remove customer records used across sales."
          action={
            <>
              <ButtonLink href="/modules/pos/customer-selection" icon={UserRound} variant="secondary">
                POS Selection
              </ButtonLink>
              <ButtonLink href="/modules/pos/new-sale" icon={Plus} variant="primary">
                New Sale
              </ButtonLink>
            </>
          }
        />

        <CustomerManagementWorkspace />
      </div>
    </ModuleShell>
  );
}
