import { ScanBarcode } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { PosPageShell } from '@/components/pos-section';
import { PosNewSaleWorkspace } from '../_components/pos-workspaces';

export default function PosNewSalePage() {
  return (
    <PosPageShell
      badge="15.12"
      title="NEW SALE SCREEN"
      description="Create new invoice / sale for customer."
      action={
        <ButtonLink href="/modules/pos/barcode-scanner" icon={ScanBarcode} variant="secondary">
          Barcode Scanner
        </ButtonLink>
      }
    >
      <PosNewSaleWorkspace />
    </PosPageShell>
  );
}
