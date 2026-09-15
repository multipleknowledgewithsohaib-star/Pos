import { SectionHero } from '@/components/section-hero';
import { BackupRestoreForm } from '@/components/backup-restore-form';

export default function RestoreBackupPage() {
  return (
    <div className="backup-page">
      <SectionHero
        badge="12.4"
        eyebrow="RESTORE BACKUP"
        title="Restore Backup"
        description="Restore your system data from a backup."
        backHref="/modules/backup-restore"
      />

      <BackupRestoreForm />
    </div>
  );
}
