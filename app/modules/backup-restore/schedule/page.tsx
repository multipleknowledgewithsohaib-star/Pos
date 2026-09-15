import Link from 'next/link';
import { Info, Save } from 'lucide-react';
import { DemoActionButton } from '@/components/demo-submit-form';
import { SectionHero } from '@/components/section-hero';
import { backupScheduleSettings } from '@/lib/settings-content';

export default function BackupSchedulePage() {
  return (
    <div className="backup-page">
      <SectionHero
        badge="12.6"
        eyebrow="BACKUP SCHEDULE SETTINGS"
        title="Backup Schedule Settings"
        description="Configure automatic backup schedule."
        backHref="/modules/backup-restore"
      />

      <form className="backup-schedule-grid">
        <section className="section-panel backup-schedule-form">
          <div className="backup-schedule-toggle-row">
            <div>
              <strong>Enable Schedule</strong>
            </div>
            <label className="switch">
              <input defaultChecked={backupScheduleSettings.enabled} type="checkbox" />
              <span />
            </label>
          </div>

          <div className="form-fields backup-schedule-fields">
            <label className="field-span-full">
              <span>Schedule Frequency</span>
              <select defaultValue={backupScheduleSettings.frequency || ''}>
                <option value="">Select frequency</option>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </label>
            <label className="field-span-full">
              <span>Backup Time</span>
              <input defaultValue={backupScheduleSettings.time} />
            </label>
            <label className="field-span-full">
              <span>Retention Period</span>
              <select defaultValue={backupScheduleSettings.retention || ''}>
                <option value="">Select retention</option>
                <option>30 Days</option>
                <option>60 Days</option>
                <option>90 Days</option>
              </select>
            </label>
          </div>
        </section>

        <aside className="section-panel backup-schedule-info">
          <div className="backup-schedule-head">
            <div className="backup-schedule-head-icon">
              <Info />
            </div>
            <h2>About Schedule</h2>
          </div>

          <div className="backup-schedule-copy">
            <p>System will automatically create backup as per the schedule.</p>
            <p>Backup will be stored for the selected retention period.</p>
            <p>Old backups will be deleted automatically.</p>
          </div>
        </aside>

        <div className="backup-create-actions">
          <Link className="button button-ghost" href="/modules/backup-restore">
            Cancel
          </Link>
          <DemoActionButton message="Backup schedule saved successfully.">
            <Save className="button-icon" />
            <span>Save Schedule</span>
          </DemoActionButton>
        </div>
      </form>
    </div>
  );
}
