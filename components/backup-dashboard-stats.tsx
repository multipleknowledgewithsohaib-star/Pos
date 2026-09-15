'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getBackupDashboardStats } from '@/lib/backup-store';

export function BackupDashboardStats() {
  const stats = useMemo(() => getBackupDashboardStats(), []);

  const cards = [
    {
      label: 'Total Backups',
      value: String(stats.totalBackups),
      link: { href: '/modules/backup-restore/list', label: 'View All' },
      tone: 'purple',
    },
    {
      label: 'Last Backup',
      value: stats.lastBackup,
      helper: stats.helper,
      tone: 'blue',
    },
    {
      label: 'Backup Size',
      value: stats.backupSize,
      link: { href: '/modules/backup-restore/list', label: 'View List' },
      tone: 'green',
    },
    {
      label: 'Status',
      value: stats.status,
      helper: stats.helper,
      tone: 'green',
    },
  ] as const;

  return (
    <section className="backup-stat-grid">
      {cards.map((stat) => (
        <article className={`backup-stat-card backup-stat-card-${stat.tone}`} key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
          {'helper' in stat && stat.helper ? <p>{stat.helper}</p> : null}
          {'link' in stat && stat.link ? <Link href={stat.link.href}>{stat.link.label}</Link> : null}
        </article>
      ))}
    </section>
  );
}
