import { PosPageShell } from '@/components/pos-section';
import { PosGatewaySettingsWorkspace } from '../_components/pos-payment-gateway-workspaces';

export default function PosGatewaySettingsPage() {
  return (
    <PosPageShell badge="15.23" title="GATEWAY SETTINGS" description="Configure Cash, Bank, Card, JazzCash, and EasyPaisa.">
      <PosGatewaySettingsWorkspace />
    </PosPageShell>
  );
}
