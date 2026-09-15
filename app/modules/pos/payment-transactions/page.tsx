import { PosPageShell } from '@/components/pos-section';
import { PosPaymentTransactionsWorkspace } from '../_components/pos-payment-gateway-workspaces';

export default function PosPaymentTransactionsPage() {
  return (
    <PosPageShell badge="15.22" title="PAYMENT TRANSACTIONS" description="Review all gateway payments from POS sales.">
      <PosPaymentTransactionsWorkspace />
    </PosPageShell>
  );
}
