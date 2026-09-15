import { PosPageShell } from '@/components/pos-section';
import { PosSalesHistoryWorkspace } from '../_components/pos-workspaces';

export default function PosSalesHistoryPage() {
  return (
    <PosPageShell badge="15.14" title="SALES HISTORY" description="View all completed sales.">
      <PosSalesHistoryWorkspace />
    </PosPageShell>
  );
}
