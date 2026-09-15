import { PosPageShell } from '@/components/pos-section';
import { PosDiscountTaxWorkspace } from '../_components/pos-workspaces';

export default function PosDiscountTaxPage() {
  return (
    <PosPageShell badge="15.16" title="DISCOUNT & TAX" description="Apply discount and tax to the sale.">
      <PosDiscountTaxWorkspace />
    </PosPageShell>
  );
}
