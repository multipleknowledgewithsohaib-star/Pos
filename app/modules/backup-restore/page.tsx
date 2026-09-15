import Link from 'next/link';
import { ButtonLink } from '@/components/ui';
import { SectionHero } from '@/components/section-hero';
import { BackupDashboardStats } from '@/components/backup-dashboard-stats';
import { backupActionCards, backupScheduleCard } from '@/lib/settings-content';

export default function BackupRestoreDashboardPage() {
  const ScheduleIcon = backupScheduleCard.icon;

  return (
    <div className="backup-page">
      <SectionHero
        badge="12.1"
        eyebrow="BACKUP & RESTORE DASHBOARD"
        title="Backup & Restore"
        description="Manage your data backups and restore."
      />

      <BackupDashboardStats />

      <section className="backup-action-grid">
        {backupActionCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className={`backup-action-card backup-action-card-${card.tone}`} key={card.title}>
              <div className={`backup-action-icon backup-action-icon-${card.tone}`}>
                <Icon />
              </div>
              <div className="backup-action-copy">
                <h2>{card.title}</h2>
                <p>{card.description}</p>
                <ButtonLink href={card.href} variant={card.buttonVariant}>
                  {card.buttonLabel}
                </ButtonLink>
              </div>
            </article>
          );
        })}

        <article className="backup-schedule-card">
          <div className="backup-schedule-icon">
            <ScheduleIcon className="backup-schedule-icon-svg" />
          </div>
          <div className="backup-schedule-copy">
            <h2>{backupScheduleCard.title}</h2>
            <p>{backupScheduleCard.description}</p>
            <strong>{backupScheduleCard.detail}</strong>
          </div>
          <ButtonLink href={backupScheduleCard.href} variant={backupScheduleCard.buttonVariant}>
            {backupScheduleCard.buttonLabel}
          </ButtonLink>
        </article>
      </section>
    </div>
  );
}
