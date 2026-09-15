import { SectionHero } from '@/components/section-hero';
import { BackupActivityWorkspace } from '@/components/backup-activity-workspace';

export default function BackupActivityPage() {
  return (
    <div className="backup-page">
      <SectionHero
        badge="12.5"
        eyebrow="ACTIVITY LOG"
        title="Backup Activity"
        description="Review backup and restore events."
      />

      <BackupActivityWorkspace />
    </div>
  );
}
