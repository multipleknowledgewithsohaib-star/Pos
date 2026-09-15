import { PosPageShell } from '@/components/pos-section';
import { PosPaymentSuccessWorkspace } from '../_components/pos-payment-gateway-workspaces';

export default function PosPaymentSuccessPage() {
  return (
    <PosPageShell badge="15.21" title="PAYMENT SUCCESS" description="Payment completed and invoice is ready.">
      <PosPaymentSuccessWorkspace />
    </PosPageShell>
  );
}
