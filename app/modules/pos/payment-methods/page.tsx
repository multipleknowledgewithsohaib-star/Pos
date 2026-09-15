import { PosPageShell } from '@/components/pos-section';
import { PosPaymentMethodWorkspace } from '../_components/pos-payment-gateway-workspaces';

export default function PosPaymentMethodsPage() {
  return (
    <PosPageShell badge="15.20" title="PAYMENT METHOD" description="Choose how the customer will pay.">
      <PosPaymentMethodWorkspace />
    </PosPageShell>
  );
}
