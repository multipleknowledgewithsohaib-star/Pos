import Link from 'next/link';
import { DatabaseBackup, Save } from 'lucide-react';
import { DemoActionButton } from '@/components/demo-submit-form';
import { SectionHero } from '@/components/section-hero';

export default function BackupSettingsPage() {
  return (
    <div className="backup-page">
      <SectionHero
        badge="12.7"
        eyebrow="BACKUP SETTINGS"
        title="Backup Settings"
        description="Configure backup preferences."
        backHref="/modules/backup-restore"
      />

      <form className="settings-grid backup-settings-grid">
        <article className="settings-card settings-card-wide">
          <div className="settings-heading">
            <DatabaseBackup />
            <h2>Backup Preferences</h2>
          </div>
          <div className="settings-columns">
            <div className="setting-toggle-row">
              <div>
                <strong>Compression</strong>
                <span>Compress backup files</span>
              </div>
              <label className="switch">
                <input defaultChecked type="checkbox" />
                <span />
              </label>
            </div>
            <div className="setting-toggle-row">
              <div>
                <strong>Encryption</strong>
                <span>Encrypt all backup archives</span>
              </div>
              <label className="switch">
                <input defaultChecked type="checkbox" />
                <span />
              </label>
            </div>
            <div className="setting-toggle-row">
              <div>
                <strong>Auto Delete Old Backups</strong>
                <span>Remove backups after retention period</span>
              </div>
              <label className="switch">
                <input defaultChecked type="checkbox" />
                <span />
              </label>
            </div>
            <div className="setting-toggle-row">
              <div>
                <strong>Backup Notifications</strong>
                <span>Send email after backup completes</span>
              </div>
              <label className="switch">
                <input defaultChecked type="checkbox" />
                <span />
              </label>
            </div>
            <label>
              <span>Backup Path</span>
              <input defaultValue="" />
            </label>
            <label>
              <span>Notification Email</span>
              <input defaultValue="" />
            </label>
          </div>
        </article>

        <article className="settings-card settings-card-wide">
          <div className="settings-heading">
            <h2>Retention & Limits</h2>
          </div>
          <div className="settings-columns three-cols">
            <label>
              <span>Retention Period</span>
              <select defaultValue="">
                <option value="">Select retention</option>
                <option>30 Days</option>
                <option>60 Days</option>
                <option>90 Days</option>
              </select>
            </label>
            <label>
              <span>Max Backups</span>
              <input defaultValue="" />
            </label>
            <label>
              <span>Default Schedule</span>
              <select defaultValue="">
                <option value="">Select schedule</option>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </label>
          </div>
        </article>

        <div className="settings-actions settings-actions-wide">
          <Link className="button button-ghost" href="/modules/backup-restore">
            Cancel
          </Link>
          <DemoActionButton message="Backup settings saved successfully.">
            <Save className="button-icon" />
            <span>Save Changes</span>
          </DemoActionButton>
        </div>
      </form>
    </div>
  );
}
