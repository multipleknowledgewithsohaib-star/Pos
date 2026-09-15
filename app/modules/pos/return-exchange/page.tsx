import { RotateCcw, Plus, History } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { PosPageShell } from '@/components/pos-section';
import { PosReturnExchangeWorkspace } from '../_components/pos-return-exchange-workspace';

export default function PosReturnExchangePage() {
  return (
    <PosPageShell
      badge="15.15"
      title="RETURN & EXCHANGE"
      description="Process customer medicine returns, replacements & view return vouchers."
      action={
        <>
          <ButtonLink href="/modules/pos/sales-history" icon={History} variant="secondary">
            Sales History
          </ButtonLink>
          <ButtonLink href="/modules/pos/new-sale" icon={Plus} variant="primary">
            New Sale
          </ButtonLink>
        </>
      }
    >
      <PosReturnExchangeWorkspace />
    </PosPageShell>
  );
}
