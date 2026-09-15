import Link from 'next/link';
import { Save } from 'lucide-react';
import { DemoActionButton } from '@/components/demo-submit-form';
import { FormPersistenceLoader } from '@/components/form-persistence';
import { SectionHero } from '@/components/section-hero';
import { notificationServerSettings, notificationToggles } from '@/lib/settings-content';

export default function NotificationSettingsPage() {
  return (
    <div className="settings-page">
      <SectionHero
        badge="11.11"
        eyebrow="NOTIFICATION SETTINGS"
        title="Notification Settings"
        description="Configure system notifications."
      />

      <form className="settings-grid settings-form-shell">
        <FormPersistenceLoader />
        <article className="settings-card settings-list-card">
          <div className="settings-heading">
            <h2>Notification Types</h2>
          </div>
          <div className="settings-toggle-list">
            {notificationToggles.map((item) => (
              <div className="setting-toggle-row" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                </div>
                <label className="switch">
                  <input defaultChecked={item.checked} type="checkbox" />
                  <span />
                </label>
              </div>
            ))}
          </div>
        </article>

        <article className="settings-card settings-list-card">
          <div className="settings-heading">
            <h2>SMTP Configuration</h2>
          </div>
          <div className="settings-inline-fields">
            <label className="settings-inline-field field-span-full">
              <span>SMTP Server</span>
              <input defaultValue={notificationServerSettings.smtpServer} />
            </label>
            <label className="settings-inline-field field-span-full">
              <span>SMTP Port</span>
              <input defaultValue={notificationServerSettings.smtpPort} />
            </label>
            <label className="settings-inline-field field-span-full">
              <span>Email</span>
              <input defaultValue={notificationServerSettings.email} type="email" />
            </label>
            <label className="settings-inline-field field-span-full">
              <span>Password</span>
              <input defaultValue={notificationServerSettings.password} type="password" />
            </label>
          </div>
        </article>

        <div className="settings-actions settings-actions-wide">
          <Link className="button button-ghost" href="/modules/settings">
            Cancel
          </Link>
          <DemoActionButton message="Notification settings saved successfully.">
            <Save className="button-icon" />
            <span>Save Changes</span>
          </DemoActionButton>
        </div>
      </form>
    </div>
  );
}
