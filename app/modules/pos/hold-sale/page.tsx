import { PosPageShell } from '@/components/pos-section';
import { PosHoldSaleWorkspace } from '../_components/pos-workspaces';

export default function PosHoldSalePage() {
  return (
    <PosPageShell badge="15.13" title="HOLD / PARK SALE" description="Hold current sale and resume later.">
      <PosHoldSaleWorkspace />
    </PosPageShell>
  );
}
