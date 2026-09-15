import { ListOrdered } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { PurchasePageShell } from '@/components/purchase-section';
import { PurchaseOcrWorkspace } from '../_components/purchase-workspaces';

export default function PurchaseOcrPage() {
  return (
    <PurchasePageShell
      badge="16.15"
      eyebrow="OCR AUTO FILL"
      title="OCR Auto Fill"
      description="Upload a purchase bill and auto-fill the draft."
      backHref="/modules/purchases/new"
      backLabel="Manual Form"
      action={
        <ButtonLink href="/modules/purchases/list" icon={ListOrdered} variant="secondary">
          Order List
        </ButtonLink>
      }
    >
      <PurchaseOcrWorkspace />
    </PurchasePageShell>
  );
}
