import type { ReactNode } from 'react';
import { ModuleShell } from '@/components/module-shell';
import { SectionHero } from '@/components/section-hero';

export function PurchasePageShell({
  badge,
  eyebrow,
  title,
  description,
  action,
  backHref,
  backLabel,
  className = '',
  children,
}: {
  badge?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <ModuleShell active="Purchases">
      <div className={`purchase-page ${className}`.trim()}>
        <SectionHero
          badge={badge}
          eyebrow={eyebrow}
          title={title}
          description={description}
          action={action}
          backHref={backHref}
          backLabel={backLabel}
        />
        {children}
      </div>
    </ModuleShell>
  );
}
