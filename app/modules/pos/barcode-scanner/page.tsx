import { PosPageShell } from '@/components/pos-section';
import { PosBarcodeScannerWorkspace } from '../_components/pos-workspaces';

export default function PosBarcodeScannerPage() {
  return (
    <PosPageShell badge="15.9" title="BARCODE SCANNER" description="Scan barcode to add medicine.">
      <PosBarcodeScannerWorkspace />
    </PosPageShell>
  );
}
