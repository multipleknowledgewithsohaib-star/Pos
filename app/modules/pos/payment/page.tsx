import { PosPageShell } from '@/components/pos-section';
import { PosPaymentWorkspace } from '../_components/pos-workspaces';

export default function PosPaymentPage() {
  return (
    <PosPageShell badge="15.19" title="PAYMENT REVIEW" description="Review totals before choosing a payment method.">
      <PosPaymentWorkspace />
    </PosPageShell>
  );
}
