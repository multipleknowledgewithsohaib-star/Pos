import { LayoutGrid, Plus } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { PosPageShell } from '@/components/pos-section';
import { PosDashboardWorkspace } from './_components/pos-dashboard-workspace';

export default function PosDashboardPage() {
  return (
    <PosPageShell
      badge="15.1"
      title="POS DASHBOARD"
      description="Overview of today's POS activity."
      action={
        <>
          <ButtonLink href="/modules/pos/quick-actions" icon={LayoutGrid} variant="secondary">
            Quick Actions
          </ButtonLink>
          <ButtonLink href="/modules/pos/new-sale" icon={Plus} variant="primary">
            New Sale
          </ButtonLink>
        </>
      }
    >
      <PosDashboardWorkspace />
    </PosPageShell>
  );
}
