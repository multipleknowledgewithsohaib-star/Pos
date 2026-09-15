import type { ReactNode } from 'react';
import { ModuleShell } from '@/components/module-shell';
import { PosProvider } from '@/lib/pos-state';
import { PurchaseProvider } from '@/lib/purchase-state';

export default function AdministrationLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleShell active="Import / Export">
      <PosProvider>
        <PurchaseProvider>{children}</PurchaseProvider>
      </PosProvider>
    </ModuleShell>
  );
}
