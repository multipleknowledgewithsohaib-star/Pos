import { PosActionGrid, PosPageShell } from '@/components/pos-section';
import { posQuickActions } from '@/lib/pos-data';

export default function PosQuickActionsPage() {
  return (
    <PosPageShell
      badge="15.11"
      title="QUICK ACTIONS"
      description="Quick access to important POS actions."
    >
      <PosActionGrid items={posQuickActions} />
    </PosPageShell>
  );
}
