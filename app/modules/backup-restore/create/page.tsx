import { SectionHero } from '@/components/section-hero';
import { BackupCreateActions } from '@/components/backup-create-actions';

export default function CreateBackupPage() {
  return (
    <div className="backup-page">
      <SectionHero
        badge="122"
        eyebrow="CREATE NEW BACKUP"
        title="Create New Backup"
        description="Create a complete backup of your system data."
        backHref="/modules/backup-restore"
      />

      <BackupCreateActions />
    </div>
  );
}
