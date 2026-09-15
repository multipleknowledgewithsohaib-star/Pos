import { PosPageShell } from '@/components/pos-section';
import { PosCustomerSelectionWorkspace } from '../_components/pos-workspaces';

export default function PosCustomerSelectionPage() {
  return (
    <PosPageShell badge="15.17" title="CUSTOMER SELECTION" description="Select customer for the sale.">
      <PosCustomerSelectionWorkspace />
    </PosPageShell>
  );
}
