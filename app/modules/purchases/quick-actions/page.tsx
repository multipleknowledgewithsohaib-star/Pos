import Link from 'next/link';
import { Plus, ScanSearch } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { PurchasePageShell } from '@/components/purchase-section';
import { purchaseQuickActions } from '@/lib/purchase-data';

export default function PurchaseQuickActionsPage() {
  return (
    <PurchasePageShell
      badge="16.12"
      eyebrow="QUICK ACTIONS"
      title="Quick Actions"
      description="Jump straight into the purchase workflows."
      backHref="/modules/purchases"
      action={
        <>
          <ButtonLink href="/modules/purchases/ocr" icon={ScanSearch} variant="secondary">
            OCR Auto Fill
          </ButtonLink>
          <ButtonLink href="/modules/purchases/new" icon={Plus} variant="primary">
            New Purchase Order
          </ButtonLink>
        </>
      }
    >
      <section className="module-reports-grid">
        {purchaseQuickActions.map((item) => {
          const Icon = item.icon;
          return (
            <Link className="module-report-card" href={item.href} key={item.title}>
              <span className={`module-report-icon module-report-icon-${item.tone}`}>
                <Icon />
              </span>
              <strong>{item.title}</strong>
            </Link>
          );
        })}
      </section>
    </PurchasePageShell>
  );
}
