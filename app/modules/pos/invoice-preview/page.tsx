import { Suspense } from 'react';
import { PosPageShell } from '@/components/pos-section';
import { PosInvoicePreviewWorkspace } from '../_components/pos-workspaces';

export default function PosInvoicePreviewPage() {
  return (
    <PosPageShell badge="15.15" title="INVOICE PREVIEW" description="Preview invoice before printing / sending.">
      <Suspense fallback={null}>
        <PosInvoicePreviewWorkspace />
      </Suspense>
    </PosPageShell>
  );
}
