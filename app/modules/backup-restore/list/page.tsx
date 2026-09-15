import { SectionHero } from '@/components/section-hero';
import { BackupListWorkspace } from '@/components/backup-list-workspace';

export default function BackupListPage() {
  return (
    <div className="backup-page">
      <SectionHero
        badge="12.2"
        eyebrow="BACKUP LIST"
        title="Backup List"
        description="View and manage all your backups."
      />

      <BackupListWorkspace />
    </div>
  );
}
