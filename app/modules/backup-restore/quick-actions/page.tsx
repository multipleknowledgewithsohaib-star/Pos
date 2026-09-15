import Link from 'next/link';
import { SectionHero } from '@/components/section-hero';
import { backupQuickActions } from '@/lib/settings-content';

export default function BackupQuickActionsPage() {
  return (
    <div className="backup-page">
      <SectionHero
        badge="13"
        eyebrow="QUICK ACTIONS"
        title="Quick Actions"
        description="Jump into backup workflows."
      />

      <section className="module-reports-grid">
        {backupQuickActions.map((item) => {
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
    </div>
  );
}
