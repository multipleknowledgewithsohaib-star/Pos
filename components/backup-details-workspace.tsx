'use client';

import { useMemo } from 'react';
import { SectionHero } from '@/components/section-hero';
import { ButtonLink } from '@/components/ui';
import { ToneBadge } from '@/components/tone-badge';
import { buildDataSummary, downloadBackupFile, getBackupBySlug } from '@/lib/backup-store';

export function BackupDetailsWorkspace({ slug }: { slug: string }) {
  const backup = useMemo(() => getBackupBySlug(slug), [slug]);
  const summary = useMemo(() => buildDataSummary(), []);

  if (!backup) {
    return (
      <div className="backup-page">
        <SectionHero
          badge="12.3"
          eyebrow="BACKUP DETAILS"
          title="Backup Not Found"
          description="This backup record does not exist."
          backHref="/modules/backup-restore/list"
        />
      </div>
    );
  }

  return (
    <div className="backup-page">
      <SectionHero
        badge="12.3"
        eyebrow="BACKUP DETAILS"
        title="Backup Details"
        description="View backup information and data summary."
        backHref="/modules/backup-restore/list"
      />

      <section className="backup-detail-grid">
        <article className="section-panel backup-info-panel">
          <div className="section-heading">
            <div>
              <h2>Backup Information</h2>
            </div>
          </div>

          <div className="backup-info-list">
            {[
              ['Backup Name', backup.name],
              ['Date & Time', backup.datetime],
              ['Size', backup.size],
              ['Type', backup.type],
              ['Compression', backup.compression],
              ['Encryption', backup.encryption],
              ['Status', backup.status],
              ['Created By', backup.createdBy],
              ['Description', backup.description],
            ].map(([label, value]) => (
              <div className="backup-info-row" key={label}>
                <span>{label}</span>
                <strong>
                  {label === 'Status' ? (
                    <ToneBadge tone={backup.status === 'Success' ? 'success' : 'danger'}>{backup.status}</ToneBadge>
                  ) : (
                    value
                  )}
                </strong>
              </div>
            ))}
          </div>
        </article>

        <article className="section-panel backup-summary-panel">
          <div className="section-heading">
            <div>
              <h2>Data Summary</h2>
            </div>
          </div>

          <div className="backup-summary-list">
            {summary.map((item) => (
              <div className="backup-summary-row" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <div className="backup-detail-actions">
        <button className="button button-outline" type="button" onClick={() => downloadBackupFile(backup)}>
          Download Backup
        </button>
        <ButtonLink href="/modules/backup-restore/restore" variant="success">
          Restore Backup
        </ButtonLink>
      </div>
    </div>
  );
}
